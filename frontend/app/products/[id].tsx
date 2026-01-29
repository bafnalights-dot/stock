import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStockStore } from '../../store/stockStore';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ProductDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { products, parts, loadParts } = useStockStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [recipe, setRecipe] = useState<any>(null);
  const [editingRecipe, setEditingRecipe] = useState(false);
  const [selectedParts, setSelectedParts] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      await loadParts();
      
      // Find product
      const prod = products.find((p) => p.id === params.id);
      if (!prod) {
        Alert.alert('Error', 'Product not found');
        router.back();
        return;
      }
      setProduct(prod);

      // Load recipe
      try {
        const response = await axios.get(`${API_URL}/api/recipes/${params.id}`);
        setRecipe(response.data);
        setSelectedParts(
          response.data.parts.map((p: any) => ({
            part_id: p.part_id,
            quantity_needed: p.quantity_needed.toString(),
          }))
        );
      } catch (error: any) {
        if (error.response?.status === 404) {
          setRecipe(null);
          setEditingRecipe(true);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPart = () => {
    setSelectedParts([...selectedParts, { part_id: '', quantity_needed: '1' }]);
  };

  const handleRemovePart = (index: number) => {
    const newParts = selectedParts.filter((_, i) => i !== index);
    setSelectedParts(newParts);
  };

  const handleSaveRecipe = async () => {
    if (selectedParts.length === 0) {
      Alert.alert('Error', 'Please add at least one part to the recipe');
      return;
    }

    const validParts = selectedParts.filter((p) => p.part_id && p.quantity_needed);
    if (validParts.length === 0) {
      Alert.alert('Error', 'Please complete all part selections');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/recipes`, {
        finished_product_id: params.id,
        parts: validParts.map((p) => ({
          part_id: p.part_id,
          quantity_needed: parseFloat(p.quantity_needed),
        })),
      });

      Alert.alert('Success', 'Recipe saved successfully!');
      setEditingRecipe(false);
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save recipe');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product?.name}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Info</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Stock:</Text>
              <Text style={styles.infoValue}>{product?.quantity}</Text>
            </View>
            {product?.category && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Category:</Text>
                <Text style={styles.infoValue}>{product.category}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recipe</Text>
            {!editingRecipe && recipe && (
              <TouchableOpacity onPress={() => setEditingRecipe(true)}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {!editingRecipe && recipe ? (
            <View style={styles.card}>
              {recipe.parts.map((part: any, index: number) => (
                <View key={index} style={styles.recipePart}>
                  <View style={styles.recipePartIcon}>
                    <Ionicons name="cube" size={20} color="#007AFF" />
                  </View>
                  <View style={styles.recipePartInfo}>
                    <Text style={styles.recipePartName}>{part.part_name}</Text>
                    <Text style={styles.recipePartMeta}>
                      Need: {part.quantity_needed} | Available: {part.available_quantity}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.card}>
              {selectedParts.map((part, index) => (
                <View key={index} style={styles.recipeEditor}>
                  <View style={styles.recipeEditorRow}>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={part.part_id}
                        onValueChange={(value) => {
                          const newParts = [...selectedParts];
                          newParts[index].part_id = value;
                          setSelectedParts(newParts);
                        }}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select part..." value="" />
                        {parts.map((p) => (
                          <Picker.Item key={p.id} label={p.name} value={p.id} />
                        ))}
                      </Picker>
                    </View>
                    <TextInput
                      style={styles.quantityInput}
                      placeholder="Qty"
                      keyboardType="decimal-pad"
                      value={part.quantity_needed}
                      onChangeText={(text) => {
                        const newParts = [...selectedParts];
                        newParts[index].quantity_needed = text;
                        setSelectedParts(newParts);
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => handleRemovePart(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              
              <TouchableOpacity style={styles.addPartButton} onPress={handleAddPart}>
                <Ionicons name="add-circle" size={24} color="#007AFF" />
                <Text style={styles.addPartButtonText}>Add Part</Text>
              </TouchableOpacity>

              <View style={styles.recipeActions}>
                <TouchableOpacity
                  style={[styles.recipeActionButton, styles.cancelButton]}
                  onPress={() => {
                    setEditingRecipe(false);
                    loadData();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.recipeActionButton, styles.saveButton]}
                  onPress={handleSaveRecipe}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Recipe</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#34C759',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  editButton: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 17,
    color: '#8E8E93',
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  recipePart: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  recipePartIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipePartInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recipePartName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  recipePartMeta: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  recipeEditor: {
    marginBottom: 12,
  },
  recipeEditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
  },
  picker: {
    height: 50,
  },
  quantityInput: {
    width: 70,
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 17,
    marginRight: 8,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  addPartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  addPartButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  recipeActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  recipeActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E5EA',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
