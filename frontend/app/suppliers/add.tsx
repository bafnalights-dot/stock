import React, { useState } from 'react';
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

export default function AddSupplierScreen() {
  const router = useRouter();
  const { addSupplier } = useStockStore();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_info: '',
  });

  const handleSubmit = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Please enter supplier name');
      return;
    }

    setLoading(true);
    try {
      await addSupplier(formData);
      Alert.alert('Success', 'Supplier added successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add supplier');
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
        <Text style={styles.headerTitle}>Add Supplier</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView style={styles.content}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Supplier Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter supplier name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Info</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Phone, email, address, etc."
                multiline
                numberOfLines={4}
                value={formData.contact_info}
                onChangeText={(text) => setFormData({ ...formData, contact_info: text })}
              />
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
              <Text style={styles.submitButtonText}>Add Supplier</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: '#5856D6',
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
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  submitButton: {
    backgroundColor: '#5856D6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
