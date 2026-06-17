import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { api } from '../mockApi';
import { COLORS, SPACING, RADIUS } from '../utils/theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

export default function DashboardScreen() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api.getDashboard().then(setStats);
    api.getBookings().then(b => setBookings(b.filter(x => x.status === 'Pending')));
  }, []);

  const renderBooking = ({ item }) => (
    <View style={styles.bookingItem}>
      <View>
        <Text style={styles.bookingPlayer}>{item.player}</Text>
        <Text style={styles.bookingDetail}>{item.turf} • {item.time}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.greenBg }]}>
          <Icon name="check" size={20} color={COLORS.green} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.redBg }]}>
          <Icon name="close" size={20} color={COLORS.red} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <LinearGradient colors={[COLORS.card, COLORS.bg]} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Vendor Dashboard</Text>
            <Text style={styles.subtitle}>Welcome back, Rahul!</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Icon name="notifications" size={24} color={COLORS.primaryLight} />
            {stats?.upcomingBookings > 0 && <View style={styles.badge} />}
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="sports-soccer" size={28} color={COLORS.primaryLight} />
            <Text style={styles.statValue}>{stats?.totalTurfs || 0}</Text>
            <Text style={styles.statLabel}>Active Turfs</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="event-available" size={28} color={COLORS.green} />
            <Text style={styles.statValue}>{stats?.upcomingBookings || 0}</Text>
            <Text style={styles.statLabel}>Pending Bookings</Text>
          </View>
          <View style={[styles.statCard, { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View>
              <Icon name="account-balance-wallet" size={28} color="#F59E0B" />
              <Text style={styles.statLabel}>Revenue This Month</Text>
            </View>
            <Text style={[styles.statValue, { color: '#FCD34D' }]}>₹ {stats?.revenueThisMonth || 0}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Action Required</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>
          {bookings.length > 0 ? (
            <FlatList
              data={bookings}
              renderItem={renderBooking}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>No pending bookings to approve.</Text>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SPACING.xl, paddingTop: SPACING.xl + 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 16, color: COLORS.subtext },
  notificationBtn: { padding: SPACING.sm, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: RADIUS.round },
  badge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.lg, gap: SPACING.lg, justifyContent: 'space-between' },
  statCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.lg, width: '47%', borderWidth: 1, borderColor: COLORS.border },
  statValue: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginTop: SPACING.sm },
  statLabel: { fontSize: 14, color: COLORS.subtext, marginTop: 4 },
  section: { padding: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  seeAll: { color: COLORS.primaryLight, fontWeight: '600' },
  bookingItem: { backgroundColor: COLORS.card, padding: SPACING.lg, borderRadius: RADIUS.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  bookingPlayer: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  bookingDetail: { fontSize: 14, color: COLORS.subtext },
  actions: { flexDirection: 'row', gap: SPACING.md },
  actionBtn: { padding: SPACING.sm, borderRadius: RADIUS.round },
  emptyText: { color: COLORS.subtext, fontStyle: 'italic' }
});
