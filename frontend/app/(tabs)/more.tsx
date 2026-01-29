import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function MoreScreen() {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  const handleExportExcel = async () => {
    try {
      setDownloading(true);
      Alert.alert('Preparing Export', 'Creating your Excel report...');

      const timestamp = new Date().getTime();
      const filename = `stock_report_${timestamp}.xlsx`;
      const fileUri = FileSystem.documentDirectory + filename;

      // Download the file
      const downloadResult = await FileSystem.downloadAsync(
        `${API_URL}/api/export/excel`,
        fileUri
      );

      if (downloadResult.status === 200) {
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Export Stock Report',
            UTI: 'com.microsoft.excel.xlsx',
          });
          Alert.alert('Success', 'Report exported successfully!');
        } else {
          Alert.alert(
            'Export Complete',
            `File saved to: ${downloadResult.uri}`,
            [
              {
                text: 'OK',
              },
            ]
          );
        }
      } else {
        throw new Error('Download failed');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', error.message || 'Could not export data');
    } finally {
      setDownloading(false);
    }
  };

  const menuItems = [
    {
      section: 'Management',
      items: [
        {
          icon: 'business',
          title: 'Suppliers',
          subtitle: 'Manage suppliers',
          color: '#5856D6',
          route: '/suppliers',
        },
        {
          icon: 'time',
          title: 'Transaction History',
          subtitle: 'View all transactions',
          color: '#FF9500',
          route: '/transactions',
        },
      ],
    },
    {
      section: 'Data',
      items: [
        {
          icon: 'download',
          title: 'Export to Excel',
          subtitle: 'Download stock report',
          color: '#34C759',
          onPress: handleExportExcel,
        },
      ],
    },
  ];

  const renderMenuItem = (item: any) => (
    <TouchableOpacity
      key={item.title}
      style={styles.menuItem}
      onPress={() => (item.onPress ? item.onPress() : router.push(item.route))}
      disabled={item.title === 'Export to Excel' && downloading}
    >
      <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon} size={24} color={item.color} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView style={styles.content}>
        {menuItems.map((section) => (
          <View key={section.section} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={styles.card}>
              {section.items.map((item, index) => (
                <View key={item.title}>
                  {renderMenuItem(item)}
                  {index < section.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#007AFF" />
            <Text style={styles.infoText}>
              Stock Management System v1.0{' '}\n
              Personal inventory tracking
            </Text>
          </View>
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
  header: {
    backgroundColor: '#8E8E93',
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginHorizontal: 16,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginLeft: 76,
  },
  infoSection: {
    padding: 16,
    marginTop: 24,
  },
  infoCard: {
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
