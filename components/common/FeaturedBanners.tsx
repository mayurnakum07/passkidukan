import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import Carousel from 'react-native-snap-carousel';

const { width: screenWidth } = Dimensions.get('window');

interface Banner {
  id: string;
  imageUrl: string;
  link: string;
}

interface FeaturedBannersProps {
  banners?: Banner[];
  onBannerPress: (link: string) => void;
}

const FeaturedBanners: React.FC<FeaturedBannersProps> = ({ banners = [], onBannerPress }) => {
  const carouselRef = useRef<Carousel<Banner>>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!isMounted || banners.length <= 1) return;

    const interval = setInterval(() => {
      try {
        if (carouselRef.current && isMounted) {
          carouselRef.current.snapToNext();
        }
      } catch (error) {
        console.warn('Carousel error:', error);
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [banners, isMounted]);

  const renderBanner = ({ item }: { item: Banner }) => (
    <TouchableOpacity
      onPress={() => onBannerPress(item.link)}
      style={styles.bannerContainer}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.bannerImage}
        resizeMode="cover"
        onError={() => console.warn('Failed to load banner:', item.imageUrl)}
      />
    </TouchableOpacity>
  );

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Carousel
        ref={carouselRef}
        data={banners}
        renderItem={renderBanner}
        sliderWidth={screenWidth}
        itemWidth={screenWidth - 32}
        autoplay={banners.length > 1}
        autoplayInterval={3000}
        loop={banners.length > 1}
        enableMomentum={false}
        lockScrollWhileSnapping={true}
        inactiveSlideScale={1}
        inactiveSlideOpacity={1}
        firstItem={0}
        activeSlideAlignment="center"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    height: 180,
  },
  bannerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: '#FFF9E5', // default for light
  },
  bannerImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
});

export default FeaturedBanners;