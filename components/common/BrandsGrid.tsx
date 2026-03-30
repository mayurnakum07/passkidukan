import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppContext } from '../../contexts/AppContext';

// Fallback brands data
const groceryBrands = [
    { id: '1', name: 'Coca-Cola', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Coca-Cola_logo.svg/2560px-Coca-Cola_logo.svg.png' },
    { id: '2', name: 'Pepsi', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Pepsi_logo_2014.svg/2560px-Pepsi_logo_2014.svg.png' },
    { id: '3', name: 'Nestle', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Nestle_logo.svg/2560px-Nestle_logo.svg.png' },
    { id: '4', name: 'Procter & Gamble', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Procter_%26_Gamble_logo.svg/2560px-Procter_%26_Gamble_logo.svg.png' },
    { id: '5', name: 'Unilever', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_Unilever.svg/2560px-Logo_Unilever.svg.png' },
    { id: '6', name: 'Lays', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Lay%27s_logo_2019.svg/2560px-Lay%27s_logo_2019.svg.png' },
    { id: '7', name: 'Cadbury', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Cadbury_logo.svg/2560px-Cadbury_logo.svg.png' },
    { id: '8', name: 'Britannia', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Britannia_Industries_logo.svg/2560px-Britannia_Industries_logo.svg.png' },
];

const pharmacyBrands = [
    { id: '1', name: 'Pfizer', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Pfizer_logo.svg/2560px-Pfizer_logo.svg.png' },
    { id: '2', name: 'Johnson & Johnson', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Johnson_%26_Johnson_logo.svg/2560px-Johnson_%26_Johnson_logo.svg.png' },
    { id: '3', name: 'Novartis', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Novartis_logo.svg/2560px-Novartis_logo.svg.png' },
    { id: '4', name: 'Roche', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Roche_logo.svg/2560px-Roche_logo.svg.png' },
    { id: '5', name: 'Merck', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Merck_logo.svg/2560px-Merck_logo.svg.png' },
    { id: '6', name: 'GSK', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/GSK_logo.svg/2560px-GSK_logo.svg.png' },
    { id: '7', name: 'AstraZeneca', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/AstraZeneca_logo.svg/2560px-AstraZeneca_logo.svg.png' },
    { id: '8', name: 'Sanofi', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Sanofi_logo.svg/2560px-Sanofi_logo.svg.png' },
];

const BrandsGrid = () => {
    const { theme, section } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { selectedStore } = useAppContext();
    const [brands, setBrands] = useState<any[]>(section === 'pharma' ? pharmacyBrands : groceryBrands);
    const [loading, setLoading] = useState(false);

    // For now, we'll use fallback data since there's no specific brands API
    // In the future, you can add API integration here
    useEffect(() => {
        console.log('   Using fallback brands data for section:', section);
        setBrands(section === 'pharma' ? pharmacyBrands : groceryBrands);
    }, [section]);

    const renderItem = ({ item }: { item: typeof brands[0] }) => (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: theme.dark ? '#4B3F1D' : '#FFF9E5',
                    borderColor: theme.colors.border,
                    shadowColor: theme.dark ? '#000' : '#FFD700',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                }
            ]}
            onPress={() => navigation.navigate('BrandDetail', { brand: item.name })}
            activeOpacity={0.85}
        >
            <Image source={{ uri: item.image }} style={styles.image} resizeMode="contain" />
        </TouchableOpacity>
    );

    return (
        <FlatList
            data={brands}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            numColumns={4}
            columnWrapperStyle={styles.row}
            scrollEnabled={false}
        />
    );
};

const styles = StyleSheet.create({
    row: {
        flex: 1,
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    card: {
        width: '22%',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    image: {
        width: 60,
        height: 60,
    },
});

export default BrandsGrid; 