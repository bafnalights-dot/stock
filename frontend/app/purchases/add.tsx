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

export default function PurchaseEntryScreen() {
  const router = useRouter();
  const { suppliers, loadSuppliers, loadParts } = useStockStore();
  
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    purchase_date: new Date(),
    item_name: '',
    part_name: '',
    category: '',
    quantity: '',
    supplier_id: '',
    purchase_price: '',
    low_stock_threshold: '10',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleSubmit = async () => {
    if (!formData.part_name || !formData.quantity || !formData.purchase_price) {
      Alert.alert('Error', 'Please fill in Part Name, Quantity, and Purchase Price');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/parts`, {
        name: formData.part_name,
        category: formData.category || formData.item_name,
        quantity: parseFloat(formData.quantity),
        supplier_id: formData.supplier_id || null,
        purchase_price: parseFloat(formData.purchase_price),
        low_stock_threshold: parseFloat(formData.low_stock_threshold),
        last_purchase_date: formData.purchase_date.toISOString(),
      });
      
      await loadParts();
      
      Alert.alert('Success', 'Purchase recorded successfully!', [
        { 
          text: 'Add Another', 
          onPress: () => {
            setFormData({
              ...formData,
              part_name: '',
              quantity: '',
              purchase_price: '',
            });
          }
        },
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to record purchase');
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
        <Text style={styles.headerTitle}>Purchase Entry</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView style={styles.content}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Purchase Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#007AFF" />
                <Text style={styles.dateText}>
                  {formData.purchase_date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Name (Category)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Hardware, Electronics"
                value={formData.item_name}
                onChangeText={(text) => setFormData({ ...formData, item_name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Part Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter part name"
                value={formData.part_name}
                onChangeText={(text) => setFormData({ ...formData, part_name: text })}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Price per Unit *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="$0.00"
                  keyboardType="decimal-pad"
                  value={formData.purchase_price}
                  onChangeText={(text) =>
                    setFormData({ ...formData, purchase_price: text })
                  }
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Supplier</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.supplier_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, supplier_id: value })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Select supplier (optional)" value="" />
                  {suppliers.map((supplier) => (
                    <Picker.Item
                      key={supplier.id}
                      label={supplier.name}
                      value={supplier.id}
                    />
                  ))}
                </Picker>
              </View>
              
              <TouchableOpacity
                style={styles.addSupplierButton}
                onPress={() => router.push('/suppliers/add')}
              >
                <Ionicons name="add-circle" size={20} color="#007AFF" />
                <Text style={styles.addSupplierText}>Add New Supplier</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Low Stock Alert Threshold</Text>
              <TextInput
                style={styles.input}
                placeholder="10"
                keyboardType="decimal-pad"
                value={formData.low_stock_threshold}
                onChangeText={(text) =>
                  setFormData({ ...formData, low_stock_threshold: text })
                }
              />
            </View>

            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Cost:</Text>
              <Text style={styles.totalValue}>
                $
                {(
                  parseFloat(formData.quantity || '0') *
                  parseFloat(formData.purchase_price || '0')
                ).toFixed(2)}
              </Text>
            </View>
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
                <Ionicons name="cart" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Record Purchase</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <DatePicker
        modal
        open={showDatePicker}
        date={formData.purchase_date}
        mode="date"
        onConfirm={(date) => {
          setShowDatePicker(false);
          setFormData({ ...formData, purchase_date: date });
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
    backgroundColor: '#007AFF',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
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
  addSupplierButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addSupplierText: {
    fontSize: 15,
    color: '#007AFF',
    marginLeft: 4,
  },
  totalSection: {
    backgroundColor: '#E3F2FF',
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
    color: '#007AFF',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  submitButton: {
    backgroundColor: '#007AFF',
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
