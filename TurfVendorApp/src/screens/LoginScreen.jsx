import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import { setAuth } from '../redux/authSlice';
import { api } from '../mockApi';
import { COLORS, SPACING, RADIUS } from '../utils/theme';
import LinearGradient from 'react-native-linear-gradient';

export default function LoginScreen() {
  const [email, setEmail] = useState('vendor@turf.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      dispatch(setAuth({ token: res.token, vendor: res.vendor }));
    } catch (e) {
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1C1107', '#2A1A0A', '#1A0F05']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Vendor Portal</Text>
          <Text style={styles.subtitle}>Manage your turfs & grow your business</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Business Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter business email"
            placeholderTextColor={COLORS.subtext}
            value={email}
            onChangeText={setEmail}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={COLORS.subtext}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: SPACING.xl },
  header: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.primaryLight, marginBottom: 8, letterSpacing: 1 },
  subtitle: { fontSize: 16, color: COLORS.subtext },
  card: { backgroundColor: 'rgba(42, 26, 10, 0.8)', padding: SPACING.xl, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  label: { color: COLORS.text, marginBottom: SPACING.xs, fontWeight: '600' },
  input: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: RADIUS.md, color: COLORS.text, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: '#452B11' },
  button: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.sm },
  buttonText: { color: '#1C1107', fontWeight: 'bold', fontSize: 16 },
});
