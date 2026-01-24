import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Play, History, BarChart3, Plus } from 'lucide-react-native';
import { theme } from '../theme';

export default function HomeScreen({ navigation }) {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Welcome back</Text>
                <Text style={styles.title}>Ready to train?</Text>
            </View>

            <View style={styles.hero}>
                <View style={styles.heroGlow} />
                <View style={styles.heroOrbOne} />
                <View style={styles.heroOrbTwo} />
                <Text style={styles.heroTitle}>Today’s Focus</Text>
                <Text style={styles.heroSubtitle}>Build strength with clean, consistent sets.</Text>

                <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Strength</Text>
                    </View>
                    <View style={styles.badgeSecondary}>
                        <Text style={styles.badgeText}>Progressive</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.mainAction}
                    onPress={() => navigation.navigate('Workout')}
                >
                    <View style={styles.iconContainer}>
                        <Play size={28} color={theme.colors.primary} fill={theme.colors.primary} />
                    </View>
                    <View style={styles.actionTextContainer}>
                        <Text style={styles.actionTitle}>Start Workout</Text>
                        <Text style={styles.actionSubtitle}>Log sets, reps, and weights</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.grid}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('History')}
                >
                    <History size={24} color={theme.colors.secondary} />
                    <Text style={styles.cardTitle}>History</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('Analytics')}
                >
                    <BarChart3 size={24} color={theme.colors.success} />
                    <Text style={styles.cardTitle}>Analytics</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Access</Text>
                <TouchableOpacity
                    style={styles.item}
                    onPress={() => navigation.navigate('Workout', { openExerciseModal: true })}
                >
                    <Plus size={20} color={theme.colors.primary} />
                    <Text style={styles.itemText}>Add New Exercise</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
    },
    header: {
        marginTop: theme.spacing.xl,
        marginBottom: theme.spacing.md,
    },
    greeting: {
        color: theme.colors.textMuted,
        fontSize: 16,
        letterSpacing: 0.3,
    },
    title: {
        color: theme.colors.text,
        fontSize: 34,
        fontWeight: 'bold',
    },
    hero: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing.lg,
        overflow: 'hidden',
    },
    heroGlow: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(56, 189, 248, 0.18)',
    },
    heroOrbOne: {
        position: 'absolute',
        bottom: -60,
        left: -30,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(129, 140, 248, 0.15)',
    },
    heroOrbTwo: {
        position: 'absolute',
        bottom: 20,
        right: -20,
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(52, 211, 153, 0.12)',
    },
    heroTitle: {
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontSize: 12,
        marginBottom: 8,
    },
    heroSubtitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: '600',
        marginBottom: theme.spacing.md,
        maxWidth: '90%',
    },
    badgeRow: {
        flexDirection: 'row',
        marginBottom: theme.spacing.md,
    },
    badge: {
        backgroundColor: 'rgba(56, 189, 248, 0.18)',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
    },
    badgeSecondary: {
        backgroundColor: 'rgba(129, 140, 248, 0.18)',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    badgeText: {
        color: theme.colors.text,
        fontSize: 12,
        fontWeight: '600',
    },
    mainAction: {
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    iconContainer: {
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    actionTextContainer: {
        marginLeft: theme.spacing.md,
    },
    actionTitle: {
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    actionSubtitle: {
        color: theme.colors.textMuted,
        fontSize: 14,
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.lg,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        width: '47%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardTitle: {
        color: theme.colors.text,
        marginTop: theme.spacing.sm,
        fontWeight: '600',
    },
    section: {
        marginTop: theme.spacing.md,
    },
    sectionTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: '600',
        marginBottom: theme.spacing.md,
    },
    item: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    itemText: {
        color: theme.colors.text,
        marginLeft: theme.spacing.md,
    },
});
