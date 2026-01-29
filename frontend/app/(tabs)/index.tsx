import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStockStore } from '../../store/stockStore';

export default function AssemblyScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { products, loadProducts, assembleProduct } = useStockStore();

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setSearchQuery(product.name);
    setShowSuggestions(false);
  };

  const handleAssemble = async () => {
    if (!selectedProduct) {
      Alert.alert('Error', 'Please select a product');
      return;
    }

    if (!selectedProduct.has_recipe) {
      Alert.alert('Error', 'This product has no recipe defined. Please add a recipe first.');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      const result = await assembleProduct(selectedProduct.id, qty);
      
      if (result.success) {
        Alert.alert(
          'Success!',
          `✅ Assembled ${qty} ${selectedProduct.name}\n\nNew Stock: ${result.new_quantity}\nCost: $${result.cost.toFixed(2)}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setSearchQuery('');
                setSelectedProduct(null);
                setQuantity('1');
                loadProducts();
              },
            },
          ]
        );
      } else {
        const insufficientText = result.insufficient_parts
          .map(
            (p: any) =>
              `${p.part_name}: Need ${p.required}, Have ${p.available}`
          )
          .join('\n');
        Alert.alert('Insufficient Parts', insufficientText);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to assemble product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quick Assembly</Text>
        <Text style={styles.headerSubtitle}>Type product name to start</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search product..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setShowSuggestions(text.length > 0);
                if (text.length === 0) {
                  setSelectedProduct(null);
                }
              }}
              onFocus={() => setShowSuggestions(searchQuery.length > 0)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSelectedProduct(null);
                  setShowSuggestions(false);
                }}
              >
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>

          {showSuggestions && filteredProducts.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleProductSelect(item)}
                  >
                    <View style={styles.suggestionIcon}>
                      <Ionicons name="gift" size={20} color="#007AFF" />
                    </View>
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionName}>{item.name}</Text>
                      <Text style={styles.suggestionMeta}>
                        Stock: {item.quantity} | {item.has_recipe ? '✓ Has Recipe' : '✗ No Recipe'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                style={styles.suggestionsList}
              />
            </View>
          )}
        </View>

        {selectedProduct && (
          <View style={styles.selectedProductCard}>
            <View style={styles.selectedProductHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#34C759" />
              <Text style={styles.selectedProductTitle}>{selectedProduct.name}</Text>
            </View>
            <View style={styles.selectedProductInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current Stock:</Text>
                <Text style={styles.infoValue}>{selectedProduct.quantity}</Text>
              </View>
              {selectedProduct.category && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Category:</Text>
                  <Text style={styles.infoValue}>{selectedProduct.category}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.quantitySection}>
          <Text style={styles.quantityLabel}>Quantity to Assemble</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                const current = parseInt(quantity) || 1;
                if (current > 1) setQuantity(String(current - 1));
              }}
            >
              <Ionicons name="remove" size={24} color="#007AFF" />
            </TouchableOpacity>
            <TextInput
              style={styles.quantityInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
              textAlign="center"
            />
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                const current = parseInt(quantity) || 0;
                setQuantity(String(current + 1));
              }}
            >
              <Ionicons name="add" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.assembleButton,
            (!selectedProduct || loading) && styles.assembleButtonDisabled,
          ]}
          onPress={handleAssemble}
          disabled={!selectedProduct || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="construct" size={24} color="#FFFFFF" />
              <Text style={styles.assembleButtonText}>Assemble Product</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            System will automatically check parts availability and update inventory
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchSection: {
    marginBottom: 16,
    zIndex: 1000,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#000000',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  suggestionsList: {
    maxHeight: 250,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  suggestionMeta: {
    fontSize: 14,
    color: '#8E8E93',
  },
  selectedProductCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedProductHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedProductTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 8,
  },
  selectedProductInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  quantitySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quantityLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    marginHorizontal: 24,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    minWidth: 60,
  },
  assembleButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  assembleButtonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0,
  },
  assembleButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 12,
    lineHeight: 20,
  },
});
