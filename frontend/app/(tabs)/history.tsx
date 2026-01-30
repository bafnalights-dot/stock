import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function HistoryScreen() {
  const [production, setProduction] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editType, setEditType] = useState<'production' | 'sales'>('production');
  const [editData, setEditData] = useState<any>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editParty, setEditParty] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, salesRes] = await Promise.all([
        axios.get(`${API_URL}/api/production`),
        axios.get(`${API_URL}/api/sales`),
      ]);
      setProduction(prodRes.data);
      setSales(salesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openEditProduction = (prod: any) => {
    setEditType('production');
    setEditData(prod);
    setEditQuantity(prod.quantity.toString());
    setEditModal(true);
  };

  const openEditSale = (sale: any) => {
    setEditType('sales');
    setEditData(sale);
    setEditQuantity(sale.quantity.toString());
    setEditParty(sale.party_name);
    setEditModal(true);
  };

  const handleSaveEdit = async () => {
    const newQty = parseInt(editQuantity);
    if (isNaN(newQty) || newQty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      if (editType === 'production') {
        await axios.put(
          `${API_URL}/api/production/${editData.id}`,
          null,
          { params: { new_quantity: newQty } }
        );
        Alert.alert('Success', 'Production updated! Stock automatically adjusted.');
      } else {
        if (!editParty) {
          Alert.alert('Error', 'Party name is required');
          return;
        }
        await axios.put(
          `${API_URL}/api/sales/${editData.id}`,
          null,
          { params: { new_quantity: newQty, party_name: editParty } }
        );
        Alert.alert('Success', 'Sale updated! Stock automatically adjusted.');
      }
      
      setEditModal(false);
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit History</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Production Records ({production.length})</Text>
          {production.length === 0 ? (
            <Text style={styles.emptyText}>No production records</Text>
          ) : (
            production.map((prod) => (
              <TouchableOpacity
                key={prod.id}
                style={styles.card}
                onPress={() => openEditProduction(prod)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="construct" size={24} color="#34C759" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{prod.item_name}</Text>
                    <Text style={styles.cardDate}>{prod.date}</Text>
                    <Text style={styles.cardQty}>Produced: {prod.quantity} units</Text>
                  </View>
                  <View style={styles.editButtonContainer}>
                    <Ionicons name="pencil" size={24} color="#007AFF" />
                    <Text style={styles.editText}>EDIT</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sales Records ({sales.length})</Text>
          {sales.length === 0 ? (
            <Text style={styles.emptyText}>No sales records</Text>
          ) : (
            sales.map((sale) => (
              <TouchableOpacity
                key={sale.id}
                style={styles.card}
                onPress={() => openEditSale(sale)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="cash" size={24} color="#007AFF" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{sale.item_name}</Text>
                    <Text style={styles.cardDate}>{sale.date}</Text>
                    <Text style={styles.cardQty}>Sold: {sale.quantity} units</Text>
                    <Text style={styles.cardParty}>To: {sale.party_name}</Text>
                  </View>
                  <View style={styles.editButtonContainer}>
                    <Ionicons name="pencil" size={24} color="#007AFF" />
                    <Text style={styles.editText}>EDIT</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#FF9500" />
          <Text style={styles.infoText}>
            Tap any entry to edit. Stock will be automatically adjusted.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={editModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit {editType === 'production' ? 'Production' : 'Sale'}
              </Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Ionicons name="close" size={28} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {editData && (
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Item: {editData.item_name}</Text>
                <Text style={styles.modalLabel}>Date: {editData.date}</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    value={editQuantity}
                    onChangeText={setEditQuantity}
                    keyboardType="number-pad"
                    placeholder="Enter quantity"
                  />
                </View>

                {editType === 'sales' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Party Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={editParty}
                      onChangeText={setEditParty}
                      placeholder="Enter party name"
                    />
                  </View>
                )}

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: '#FF9500', padding: 24, paddingTop: 16 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  content: { flex: 1 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#000' },
  card: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#000', marginBottom: 4 },
  cardDate: { fontSize: 14, color: '#8E8E93', marginBottom: 4 },
  cardQty: { fontSize: 15, color: '#000', fontWeight: '500' },
  cardParty: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
  editButtonContainer: { alignItems: 'center', paddingHorizontal: 12 },
  editText: { fontSize: 12, fontWeight: '600', color: '#007AFF', marginTop: 4 },
  emptyText: { fontSize: 15, color: '#8E8E93', textAlign: 'center', paddingVertical: 40, fontStyle: 'italic' },
  infoBox: { flexDirection: 'row', backgroundColor: '#FFF3E0', padding: 16, borderRadius: 12, margin: 16, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 14, color: '#FF9500', marginLeft: 12, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  modalBody: { padding: 20 },
  modalLabel: { fontSize: 15, color: '#8E8E93', marginBottom: 12 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, padding: 12, fontSize: 17 },
  saveButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveButtonText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
});
