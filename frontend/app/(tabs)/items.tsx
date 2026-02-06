import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ItemsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Street Light',
    opening_stock: '0',
  });

  useEffect(() => {
    loadItems();
  }, []);

  // Load items
  const loadItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/items`);
      setItems(res.data);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to load items');
    }
  };

  // Open modal
  const openAddModal = () => {
    setFormData({
      name: '',
      category: 'Street Light',
      opening_stock: '0',
    });
    setShowModal(true);
  };

  // Save item
  const handleSaveItem = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Enter item name');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        opening_stock: parseInt(formData.opening_stock),
      };

      await axios.post(`${API_URL}/api/items`, payload);

      Alert.alert('Success', 'Item added');

      setShowModal(false);
      loadItems();

    } catch (err: any) {
      console.log(err);
      Alert.alert('Error', 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Items</Text>

        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <ScrollView style={styles.content}>
        {items.map((item, index) => (
          <View key={index} style={styles.itemCard}>

            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCategory}>{item.category}</Text>

            <View style={styles.stockBadge}>
              <Text style={styles.stockText}>
                Stock: {item.stock}
              </Text>
            </View>

          </View>
        ))}

        {items.length === 0 && (
          <Text style={styles.emptyText}>
            No items yet
          </Text>
        )}
      </ScrollView>

      {/* MODAL */}
      <Modal visible={showModal} animationType="slide">

        <SafeAreaView style={styles.modalContainer}>

          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={26} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Add Item</Text>

            <View style={{ width: 26 }} />
          </View>

          <ScrollView style={styles.modalContent}>

            {/* NAME */}
            <Text style={styles.label}>Item Name</Text>

            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(t) =>
                setFormData({ ...formData, name: t })
              }
              placeholder="50W Flood Light"
            />

            {/* CATEGORY */}
            <Text style={styles.label}>Category</Text>

            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(v) =>
                  setFormData({ ...formData, category: v })
                }
              >
                <Picker.Item label="Street Light" value="Street Light" />
                <Picker.Item label="Flood Light" value="Flood Light" />
              </Picker>
            </View>

            {/* STOCK */}
            <Text style={styles.label}>Opening Stock</Text>

            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={formData.opening_stock}
              onChangeText={(t) =>
                setFormData({ ...formData, opening_stock: t })
              }
              placeholder="0"
            />

            {/* SAVE */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveItem}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  Save Item
                </Text>
              )}
            </TouchableOpacity>

          </ScrollView>

        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  header: {
    backgroundColor: '#FF9500',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
  },

  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    padding: 16,
  },

  itemCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },

  itemName: {
    fontSize: 18,
    fontWeight: '600',
  },

  itemCategory: {
    color: '#777',
    marginTop: 4,
  },

  stockBadge: {
    marginTop: 8,
  },

  stockText: {
    fontWeight: 'bold',
    color: '#007AFF',
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  modalContent: {
    padding: 16,
  },

  label: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '600',
  },

  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
  },

  input: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#DDD',
    padding: 12,
    backgroundColor: '#FFF',
  },

  saveButton: {
    backgroundColor: '#FF9500',
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },

  saveButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },

});
