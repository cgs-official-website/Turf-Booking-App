import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { api } from '../mockApi';
import { COLORS, SPACING, RADIUS } from '../utils/theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

export default function HomeScreen() {
  const [turfs, setTurfs] = useState([]);

  useEffect(() => {
    api.getTurfs().then(data => setTurfs(data.filter(t => t.status === 'Approved')));
  }, []);

  const renderTurfCard = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.imagePlaceholder}>
        <Icon name="sports-soccer" size={48} color={COLORS.primaryLight} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.ratingBadge}>
            <Icon name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>4.8</Text>
          </View>
        </View>
        <Text style={styles.sportText}>{item.sport} • {item.specs.split(',')[0]}</Text>
        <View style={styles.locationRow}>
          <Icon name="location-on" size={16} color={COLORS.subtext} />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Book Slot</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <LinearGradient colors={[COLORS.card, COLORS.bg]} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Evening, Player!</Text>
            <Text style={styles.subtitle}>Ready for a match?</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Icon name="notifications-none" size={24} color={COLORS.text} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Turfs</Text>
          <FlatList
            data={turfs}
            renderItem={renderTurfCard}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: SPACING.lg }}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore Sports</Text>
          <View style={styles.sportsGrid}>
            {['Football', 'Cricket', 'Basketball', 'Badminton'].map(sport => (
              <TouchableOpacity key={sport} style={styles.sportChip}>
                <Text style={styles.sportChipText}>{sport}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SPACING.xl, paddingTop: SPACING.xl + 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 16, color: COLORS.subtext },
  notificationBtn: { padding: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.round },
  badge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red },
  section: { marginVertical: SPACING.lg },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: COLORS.text, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, width: 280, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  imagePlaceholder: { height: 140, backgroundColor: 'rgba(22, 163, 74, 0.1)', justifyContent: 'center', alignItems: 'center' },
  cardBody: { padding: SPACING.lg },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  ratingText: { color: '#F59E0B', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  sportText: { fontSize: 14, color: COLORS.primaryLight, marginBottom: 12, fontWeight: '500' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  locationText: { color: COLORS.subtext, fontSize: 14, marginLeft: 4 },
  bookButton: { backgroundColor: COLORS.primary, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, alignItems: 'center' },
  bookButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  sportsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: SPACING.md },
  sportChip: { backgroundColor: COLORS.card, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.round, borderWidth: 1, borderColor: COLORS.border },
  sportChipText: { color: COLORS.text, fontWeight: '500' },
});
