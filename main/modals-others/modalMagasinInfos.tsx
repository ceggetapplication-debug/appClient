import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { buildStorePhoto, buildSharedPhoto, SharedPhotoUrls, StorePhoto } from '../calculation-logic/imagesLogic';
import { databases, config } from '../calculation-logic/appwriteConfig';
import { Colors } from '@/constants/Colors';
import { useAppTranslation } from '@/translations/data/translationCentralization';

export interface Adresse {
  id: number;
  adresse: string;
  typeDomicile: string;
  numeroDomicile: string;
  photoPorteEntree: string;
  informationsSupplementaires: string;
  latitude: number;
  longitude: number;
}

export interface Product {
  id: string;
  name: string;
  store: string;
  address: string;
  descriptionFr: string;
  descriptionKab: string;
  marque?: string;
  prix: number;
  oldPrice?: number;
  quantity_unit_dzd_per_kg?: number;
  image: { uri: string; width: number; height: number };
  imageId?: string | null;
  category: { id: string; name: string };
  productType?: { id: string; name: string };
  valeurQuantite?: number;
  uniteQuantite?: string;
  nombreCommandes?: number;
}

export interface ProductType {
  id: string;
  name: string;
  products: Product[];
}

export interface Category {
  image?: { uri: string; width: number; height: number } | undefined;
  imageId?: string | null;
  id: string;
  name: string;
  productTypes?: ProductType[];
  products?: Product[];
}

export interface Store {
  id: string;
  name: string;
  photo: string;
  imageId?: string | null;
  categories?: Category[];
}

export interface StoreDetailed extends Store {
  likes: number;
  adresseDetails?: { adresse: string };
  photosPartagees?: SharedPhotoUrls[];
  email?: string;
  telephone?: string;
  horaires?: {
    lundi: { ouverture: string; fermeture: string } | null;
    mardi: { ouverture: string; fermeture: string } | null;
    mercredi: { ouverture: string; fermeture: string } | null;
    jeudi: { ouverture: string; fermeture: string } | null;
    vendredi: { ouverture: string; fermeture: string } | null;
    samedi: { ouverture: string; fermeture: string } | null;
    dimanche: { ouverture: string; fermeture: string } | null;
  };
  originalStoreId?: string;
}

export interface StoreType {
  id: string;
  name: string;
  stores?: Store[];
  storesD?: StoreDetailed[];
}

export interface Group {
  id: string;
  name: string;
  photo: string;
  imageId?: string | null;
  typesDeStore: StoreType[];
}

interface Props {
  visible: boolean;
  storeId: string | null;
  onClose: () => void;
  groupesStore: Group[];
  selectedTypeStore: StoreType | null;
  setSelectedStoreD: (m: StoreDetailed | null) => void;
  setSelectedGroupe: (g: Group | null) => void;
  setSelectedTypeStore: (t: StoreType | null) => void;
  setSelectedStore: (m: Store | null) => void;
  setVisibleCategories: (c: Category[]) => void;
  setSelectedCategory: (c: Category | null) => void;
  setOpenProductType: (id: string | null) => void;
}

export default function StoreDetailsScreen({
  visible,
  storeId,
  onClose,
  groupesStore,
  selectedTypeStore,
  setSelectedStoreD,
  setSelectedGroupe,
  setSelectedTypeStore: setTypeStore,
  setSelectedStore,
  setVisibleCategories,
  setSelectedCategory,
  setOpenProductType,
}: Props) {

  const [store, setStore] = useState<StoreDetailed | null>(null);
  const [loading, setLoading] = useState(false);
  const [favoris, setFavoris] = useState<string[]>([]);
  const { t } = useAppTranslation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const styles = getStyles(theme);
  const colors = Colors[theme];

  useEffect(() => {
    if (storeId) {
      databases.getDocument(config.databaseId, config.storesCollectionId, storeId)
        .then((doc: any) => {
          if (doc.favoris) setFavoris(doc.favoris);
        })
        .catch(() => { });
    }
  }, [storeId]);

  const toggleFavori = async (id: string) => {
    const isFav = favoris.includes(id);
    const next = isFav ? favoris.filter((f: string) => f !== id) : [...favoris, id];
    setFavoris(next);

    if (store) {
      const newLikes = isFav ? Math.max(0, (store.likes || 0) - 1) : (store.likes || 0) + 1;
      setStore({ ...store, likes: newLikes });
      try {
        await databases.updateDocument(
          config.databaseId,
          config.storesCollectionId || 'stores',
          id,
          { likes: newLikes }
        );
      } catch (err) {
        console.error("Erreur mise à jour likes Appwrite:", err);
      }
    }
  };

  useEffect(() => {
    if (!visible) return;
    if (!storeId) return;
    console.log('fetch store:', storeId);
    setLoading(true);
    databases.getDocument(config.databaseId, config.storesCollectionId, storeId)
      .then((doc: any) => {
        setStore({
          id: doc.$id,
          name: doc.name || doc.nom,
          photo: buildStorePhoto(doc.$id).cover,
          likes: doc.likes ?? 0,
          email: doc.email,
          telephone: doc.telephone,
          originalStoreId: doc.originalStoreId,
          adresseDetails: doc.adresseDetails ? { adresse: doc.adresseDetails } : undefined,
          photosPartagees: doc.photosPartagees ? doc.photosPartagees.map((id: string) => buildSharedPhoto(id)) : [],
          horaires: doc.horaires ? JSON.parse(doc.horaires) : undefined,
        });
      })
      .catch(() => Alert.alert(t('general.error'), t('error.storeNotFound')))
      .finally(() => setLoading(false));
  }, [visible, storeId]);

  const type = selectedTypeStore;
  const group = groupesStore.find(g => g.typesDeStore.some(tm => tm.id === type?.id));

  return (
    <View style={styles.hierarchyScreen}>
      <View style={styles.hierarchyHeader}>
        <View style={styles.storeHeaderRow}>
          <TouchableOpacity onPress={() => {
            if (!store) return;
            let targetGroupe = group;
            let targetType = type;
            let targetMag = targetType?.stores?.find(m => m.id === store.originalStoreId);

            if (!targetGroupe || !targetType || !targetMag) {
              targetGroupe = groupesStore.find(g =>
                g.typesDeStore.some(tm => tm.stores?.some(m => m.id === store.originalStoreId))
              );
              targetType = targetGroupe?.typesDeStore.find(tm =>
                tm.stores?.some(m => m.id === store.originalStoreId)
              ) || null;
              targetMag = targetType?.stores?.find(m => m.id === store.originalStoreId);
            }

            if (targetGroupe && targetType && targetMag) {
              setSelectedStoreD(null);
              setSelectedGroupe(targetGroupe);
              setTypeStore(targetType);
              const cats = targetMag.categories ?? [];
              setSelectedStore(targetMag);
              setVisibleCategories(cats);
              if (cats.length > 0) {
                setSelectedCategory(cats[0]);
                if (cats[0].productTypes && cats[0].productTypes.length > 0) {
                  setOpenProductType(cats[0].productTypes[0].id);
                }
              }
            } else {
              onClose();
            }
          }}>
            <Ionicons name="chevron-back" size={28} color={colors.icon} />
          </TouchableOpacity>
          <Text style={styles.detailStoreNom} numberOfLines={1}>{store?.name}</Text>
        </View>
      </View>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.errorText} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.buttonList}>
          <Image source={{ uri: store?.photo }} style={styles.detailPhotoCover} />
          <View style={styles.detailFavorisRow}>
            <Text style={styles.detailLabel}>
              {(favoris ?? []).includes(store?.id ?? '') ? t('kkesSiLesFav') : t('rnuArLesFav')}
            </Text>
            <TouchableOpacity onPress={() => store?.id && toggleFavori(store.id)}>
              <Ionicons
                name={store?.id && (favoris ?? []).includes(store.id) ? 'heart' : 'heart-outline'}
                size={32}
                color={store?.id && (favoris ?? []).includes(store.id) ? 'red' : colors.errorText}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.detailLabel}>
            {t('magAimePar', { count: '{{count}}' }).split('{{count}}').map((part, index) => (
              <React.Fragment key={index}>
                {part}
                {index === 0 && <Text style={{ color: colors.tint, fontWeight: 'bold' }}>{store?.likes ?? 0}</Text>}
              </React.Fragment>
            ))}
          </Text>
          <Text style={styles.detailLabel}>{t('commandList.address')}</Text>
          <Text style={styles.detailText}>{store?.adresseDetails?.adresse ?? t('ordersByStore.storeLocationUnavailable')}</Text>

          {store?.photosPartagees && store.photosPartagees.length > 0 && (
            <View>
              <Text style={styles.detailLabel}>{t('fotoPartaji')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storeDetailsPhotosScroll}>
                {store.photosPartagees.map((photo: SharedPhotoUrls, index: number) => (
                  <Image
                    key={index}
                    source={{ uri: photo.pleinEcran }}
                    style={styles.detailPhotoShared}
                  />
                ))}
              </ScrollView>
            </View>
          )}


          <View style={styles.detailFavorisRow}>
            <Text style={styles.detailLabel}>{t('rohArLeMag')}</Text>
            <TouchableOpacity onPress={() => {
              if (!store) return;
              let targetGroupe = group;
              let targetType = type;
              let targetMag = targetType?.stores?.find(m => m.id === store.originalStoreId);

              if (!targetGroupe || !targetType || !targetMag) {
                targetGroupe = groupesStore.find(g =>
                  g.typesDeStore.some(tm => tm.stores?.some(m => m.id === store.originalStoreId))
                );
                targetType = targetGroupe?.typesDeStore.find(tm =>
                  tm.stores?.some(m => m.id === store.originalStoreId)
                ) || null;
                targetMag = targetType?.stores?.find(m => m.id === store.originalStoreId);
              }

              if (targetGroupe && targetType && targetMag) {
                setSelectedStoreD(null);
                const cats = targetMag.categories ?? [];
                setSelectedStore(targetMag);
                setVisibleCategories(cats);
                if (cats.length > 0) {
                  setSelectedCategory(cats[0]);
                  if (cats[0].productTypes && cats[0].productTypes.length > 0) {
                    setOpenProductType(cats[0].productTypes[0].id);
                  }
                }
              }
            }}>
              <Ionicons name="open-outline" size={28} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <Text style={styles.detailLabel}>{t('meymiIleddi')}</Text>
          {store?.horaires?.dimanche && (
            <View style={styles.detailFavorisRow}>
              <Text style={styles.detailText}>{t('Sunday')}</Text>
              <Text style={styles.detailTextGris}>{store.horaires.dimanche.ouverture} - {store.horaires.dimanche.fermeture}</Text>
            </View>
          )}
          {store?.horaires?.lundi && (
            <View style={styles.detailFavorisRow}>
              <Text style={styles.detailText}>{t('Monday')}</Text>
              <Text style={styles.detailTextGris}>{store.horaires.lundi.ouverture} - {store.horaires.lundi.fermeture}</Text>
            </View>
          )}
          {store?.horaires?.mardi && (
            <View style={styles.detailFavorisRow}>
              <Text style={styles.detailText}>{t('Tuesday')}</Text>
              <Text style={styles.detailTextGris}>{store.horaires.mardi.ouverture} - {store.horaires.mardi.fermeture}</Text>
            </View>
          )}
          {store?.horaires?.mercredi && (
            <View style={styles.detailFavorisRow}>
              <Text style={styles.detailText}>{t('Wednesday')}</Text>
              <Text style={styles.detailTextGris}>{store.horaires.mercredi.ouverture} - {store.horaires.mercredi.fermeture}</Text>
            </View>
          )}
          {store?.horaires?.jeudi && (
            <View style={styles.detailFavorisRow}>
              <Text style={styles.detailText}>{t('Thursday')}</Text>
              <Text style={styles.detailTextGris}>{store.horaires.jeudi.ouverture} - {store.horaires.jeudi.fermeture}</Text>
            </View>
          )}
          {store?.horaires?.vendredi && (
            <View style={styles.detailFavorisRow}>
              <Text style={styles.detailText}>{t('Friday')}</Text>
              <Text style={styles.detailTextGris}>{store.horaires.vendredi.ouverture} - {store.horaires.vendredi.fermeture}</Text>
            </View>
          )}
          {store?.horaires?.samedi && (
            <View style={styles.detailFavorisRow}>
              <Text style={styles.detailText}>{t('Saturday')}</Text>
              <Text style={styles.detailTextGris}>{store.horaires.samedi.ouverture} - {store.horaires.samedi.fermeture}</Text>
            </View>
          )}

          <Text style={styles.detailLabel}>{t('contactMag')}</Text>
          <View style={styles.detailFavorisRow}>
            <Text style={styles.detailText}>{t('profileScreen.email')}</Text>
            <Text style={styles.detailTextGris}>{store?.email ?? t('noDispo')}</Text>
          </View>
          <View style={styles.detailFavorisRow}>
            <Text style={styles.detailText}>{t('profileScreen.phoneNumber')}</Text>
            <Text style={styles.detailTextGris}>{store?.telephone ?? t('noDispo')}</Text>
          </View>

        </ScrollView>
      )}
    </View>
  );
}

const getStyles = (theme: 'light' | 'dark') => {
  const colors = Colors[theme];
  return StyleSheet.create({
    loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    hierarchyScreen: {
      flex: 1,
      backgroundColor: colors.background,
      margin: 0,
      padding: 0,
    },
    hierarchyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      marginBottom: 20,
      marginTop: 35,
      gap: 12,
    },
    buttonList: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    storeHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 10,
      paddingHorizontal: 10,
      marginVertical: 10,
    },
    chevronButton: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingRight: 4,
    },
    detailStoreNom: {
      fontSize: 20,
      fontWeight: 'bold',
      fontStyle: 'italic',
      color: colors.green,
      textAlign: 'left',
    },
    detailPhotoCover: {
      width: '100%',
      height: 150,
      borderRadius: 16,
      marginBottom: 12,
    },
    detailFavorisRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 10,
      flexWrap: 'wrap',
      paddingHorizontal: 4,
    },
    detailLabel: {
      fontSize: 15,
      fontWeight: 'bold',
      fontStyle: 'italic',
      color: colors.text,
      marginBottom: 4,
      marginTop: 10,
      marginLeft: 0,
    },
    detailText: {
      fontSize: 14,
      color: colors.textNormal,
      marginBottom: 4,
      paddingHorizontal: 4,
      marginLeft: -5,
    },
    detailTextGris: {
      fontSize: 14,
      color: colors.greyDes,
      marginBottom: 4,
      paddingHorizontal: 4,
    },
    storeDetailsPhotosScroll: {
      gap: 12,
      paddingHorizontal: 16,
    },
    detailPhotoShared: {
      width: 280,
      height: 280,
      borderRadius: 12,
      marginTop: 10,
    },
  });
};
