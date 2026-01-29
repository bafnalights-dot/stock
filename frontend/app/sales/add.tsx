import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStockStore } from '../../store/stockStore';
import { Picker } from '@react-native-picker/picker';
import DatePicker from 'react-native-date-picker';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function SalesEntryScreen() {
  const router = useRouter();
  const { products, loadProducts } = useStockStore();
  
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    sale_date: new Date(),
    finished_product_id: '',
    quantity: '',
    party_name: '',
    sale_price: '',
    notes: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const selectedProduct = products.find((p) => p.id === formData.finished_product_id);

  const handleSubmit = async () => {
    if (!formData.finished_product_id || !formData.quantity || !formData.party_name) {
      Alert.alert('Error', 'Please fill in Product, Quantity, and Party Name');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (selectedProduct && quantity > selectedProduct.quantity) {
      Alert.alert(
        'Insufficient Stock',
        `Only ${selectedProduct.quantity} units available in stock`
      );
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/sales`, {
        sale_date: formData.sale_date.toISOString(),
        finished_product_id: formData.finished_product_id,
        quantity: quantity,
        party_name: formData.party_name,
        sale_price: parseFloat(formData.sale_price || '0'),
        notes: formData.notes,
      });
      
      await loadProducts();
      
      Alert.alert(
        'Success',
        `Sale recorded! ${quantity} ${selectedProduct?.name} sold to ${formData.party_name}`,
        [
          { 
            text: 'Add Another', 
            onPress: () => {
              setFormData({
                ...formData,
                finished_product_id: '',
                quantity: '',
                party_name: '',
                sale_price: '',
                notes: '',
              });
            }
          },
          { text: 'Done', onPress: () => router.back() },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Entry</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView style={styles.content}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sale Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#34C759" />
                <Text style={styles.dateText}>
                  {formData.sale_date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Name *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.finished_product_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, finished_product_id: value })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Select product..." value="" />
                  {products.map((product) => (
                    <Picker.Item
                      key={product.id}
                      label={`${product.name} (Stock: ${product.quantity})`}
                      value={product.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {selectedProduct && (
              <View style={styles.stockInfo}>
                <Ionicons name="information-circle" size={20} color="#007AFF" />
                <Text style={styles.stockInfoText}>
                  Available Stock: {selectedProduct.quantity} units
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter quantity"
                keyboardType="number-pad"
                value={formData.quantity}
                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Party/Customer Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter customer name"
                value={formData.party_name}
                onChangeText={(text) => setFormData({ ...formData, party_name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sale Price (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="$0.00"
                keyboardType="decimal-pad"
                value={formData.sale_price}
                onChangeText={(text) => setFormData({ ...formData, sale_price: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any notes about this sale"
                multiline
                numberOfLines={3}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
              />
            </View>

            {formData.sale_price && formData.quantity && (
              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total Revenue:</Text>
                <Text style={styles.totalValue}>
                  $
                  {(
                    parseFloat(formData.quantity || '0') *
                    parseFloat(formData.sale_price || '0')
                  ).toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Record Sale</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <DatePicker
        modal
        open={showDatePicker}
        date={formData.sale_date}
        mode="date"
        onConfirm={(date) => {
          setShowDatePicker(false);
          setFormData({ ...formData, sale_date: date });
        }}
        onCancel={() => setShowDatePicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  flex: {
    flex: 1,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 17,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dateText: {
    fontSize: 17,
    color: '#000000',
    marginLeft: 12,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  stockInfoText: {
    fontSize: 15,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  totalSection: {
    backgroundColor: '#E8F8EC',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34C759',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  submitButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
