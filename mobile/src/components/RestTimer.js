import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Timer, X, RotateCcw } from 'lucide-react-native';
import { theme } from '../theme';

export default function RestTimer({ initialSeconds = 60, onComplete }) {
    const [seconds, setSeconds] = useState(initialSeconds);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        let interval = null;
        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds((prev) => prev - 1);
            }, 1000);
        } else if (seconds === 0) {
            setIsActive(false);
            if (onComplete) onComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, seconds]);

    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        return `${mins}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <View style={styles.container}>
            <Timer size={20} color={theme.colors.primary} />
            <Text style={styles.timerText}>Rest: {formatTime(seconds)}</Text>
            <TouchableOpacity onPress={() => setSeconds(prev => prev + 30)} style={styles.button}>
                <Text style={styles.buttonText}>+30s</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSeconds(0)} style={styles.close}>
                <X size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.primary,
        position: 'absolute',
        top: 10,
        alignSelf: 'center',
        zIndex: 100,
    },
    timerText: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: 'bold',
        marginHorizontal: theme.spacing.sm,
    },
    button: {
        paddingHorizontal: 8,
        borderLeftWidth: 1,
        borderLeftColor: theme.colors.border,
    },
    buttonText: {
        color: theme.colors.primary,
        fontSize: 12,
    },
    close: {
        marginLeft: 8,
    }
});
