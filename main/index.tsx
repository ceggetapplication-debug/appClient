import { Alert, FlatList, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { client, databases } from "@/services/api/init";
import { useStore } from "@/services/store/store";
import { t } from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import { Account, ID, Query } from "react-native-appwrite";
import { Button, Text } from "react-native-paper";
import { useUnistyles } from "react-native-unistyles";
import { DB_CONFIG } from "../utils/vars";


import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import Icons from "@expo/vector-icons/MaterialIcons";
import MasonryList from "reanimated-masonry-list";
import { BlurView } from "expo-blur";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import CustomBackdrop from "@/components/components/CustomBackdrop";
import FilterView from "@/components/components/FilterView";
import { useFavorites } from "@/hooks/useFavorites";
import { useProducts } from "@/hooks/useProducts";
import { Header } from "@/components/components/Header";
import { SearchBar } from "@/components/components/SearchBar";
import type { Product } from "../types";
import { useCart } from "@/contexts/CartContext";

const CATEGORIES = [
	"Fruits",
	"Légumes",
	"Produits Frais",
	"Yaourts",
];

const AVATAR_URL =
	"https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80";

const MESONARY_LIST_DATA = [
	{
		imageUrl:
			"https://images.unsplash.com/photo-1521577352947-9bb58764b69a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=986&q=80",
		title: "PUMA Everyday Hussle",
		price: 160,
	},
	{
		imageUrl:
			"https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=987&q=80",
		title: "PUMA Everyday Hussle",
		price: 180,
	},
	{
		imageUrl:
			"https://images.unsplash.com/photo-1556217477-d325251ece38?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1020&q=80",
		title: "PUMA Everyday Hussle",
		price: 200,
	},
	{
		imageUrl:
			"https://images.unsplash.com/photo-1554568218-0f1715e72254?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=987&q=80",
		title: "PUMA Everyday Hussle",
		price: 180,
	},
	{
		imageUrl:
			"https://images.unsplash.com/photo-1627225924765-552d49cf47ad?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=987&q=80",
		title: "PUMA Everyday Hussle",
		price: 120,
	},
];

const HomeScreen = ({ navigation }) => {
	const { colors } = useTheme();
	const [categoryIndex, setCategoryIndex] = useState(0);
	const { products, loading, refreshing, onRefresh } = useProducts();
	const user = { $id: 'your-user-id' };
	const { toggleFavorite } = useFavorites(user);
	const { addToCart } = useCart();
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

	const openProductDetails = (product: Product) => {
		setSelectedProduct(product);
	};

	const closeProductDetails = () => {
		setSelectedProduct(null);
	};

	if (loading && !refreshing) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<Text>Chargement des produits...</Text>
			</View>
		);
	}

	return (
		<ScrollView
			refreshControl={
				<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
			}
		>
			<SafeAreaView style={{ paddingVertical: 24, gap: 24 }}>
				<Header />
				<SearchBar onFilterPress={(() => console.log("first"))} />
				{/* Header and SearchBar components */}

				{/* Category FlatList */}

				<FlatList
					data={products}
					numColumns={2}
					contentContainerStyle={{ paddingHorizontal: 12 }}
					showsVerticalScrollIndicator={false}
					renderItem={({ item, index }: { item: Product, index: number }) => (
						<Pressable onPress={() => openProductDetails(item)} style={{ flex: 1, padding: 6 }}>
							<View style={{ aspectRatio: index === 0 ? 1 : 2 / 3, position: "relative", overflow: "hidden", borderRadius: 24 }}>
								<Image source={{ uri: item.imageUrl }} resizeMode="cover" style={StyleSheet.absoluteFill} />
								<View style={[StyleSheet.absoluteFill, { padding: 12 }]}>
									{/* Product details */}
									<BlurView style={{ flexDirection: "row", backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", padding: 6, borderRadius: 100, overflow: "hidden" }} intensity={20}>
										<Text style={{ flex: 1, fontSize: 16, fontWeight: "600", color: "#fff", marginLeft: 8 }} numberOfLines={1}>
											{item.price} DA
										</Text>
										<TouchableOpacity onPress={() => addToCart(item)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, backgroundColor: "#fff" }}>
											<Icons name="add-shopping-cart" size={18} color="#000" />
										</TouchableOpacity>
									</BlurView>
								</View>
							</View>
						</Pressable>
					)}
				/>
			</SafeAreaView>

			<Modal
				animationType="slide"
				transparent={true}
				visible={selectedProduct !== null}
				onRequestClose={closeProductDetails}
			>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
					<View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
						{selectedProduct && (
							<>
								<Text style={{ fontSize: 20, fontWeight: 'bold' }}>{selectedProduct.name}</Text>
								<Text style={{ fontSize: 18, color: 'gray', marginVertical: 10 }}>{selectedProduct.price} DA</Text>
								<Image source={{ uri: selectedProduct.imageUrl }} style={{ width: '100%', height: 200, borderRadius: 10 }} />
								<TouchableOpacity onPress={closeProductDetails} style={{ marginTop: 20, backgroundColor: colors.primary, padding: 10, borderRadius: 5 }}>
									<Text style={{ color: 'white', textAlign: 'center' }}>Fermer</Text>
								</TouchableOpacity>
							</>
						)}
					</View>
				</View>
			</Modal>
		</ScrollView>
	);
};

export default HomeScreen;

const Card = ({
	price,
	imageUrl,
	onPress,
}: {
	price: number;
	imageUrl: string;
	onPress?: () => void;
}) => {
	return (
		<TouchableOpacity
			onPress={onPress}
			style={{
				flex: 1,
				position: "relative",
				overflow: "hidden",
				borderRadius: 24,
			}}
		>
			<Image
				source={{
					uri: imageUrl,
				}}
				resizeMode="cover"
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					bottom: 0,
					right: 0,
				}}
			/>
			<View
				style={{
					position: "absolute",
					left: 12,
					top: 12,
					paddingHorizontal: 12,
					paddingVertical: 8,
					backgroundColor: "rgba(0,0,0,0.25)",
					borderRadius: 100,
					backdropFilter: "blur(4px)", // Add blur effect
				}}
			>
				<Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
					${price.toLocaleString()} // Add number formatting
				</Text>
			</View>
			{/* Add accessibility label */}
			<View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0)" }} accessibilityLabel={`Card with price $${price}`} />
		</TouchableOpacity>
	);
};


// export default function HomeScreen() {
// 	const { theme } = useUnistyles();
// 	const { user, setUser } = useStore();

// 	const [isLoading, setIsLoading] = useState(false);

// 	const logOut = async () => {
// 		try {
// 			setIsLoading(true);
// 			const account = new Account(client);
// 			const result = await account.deleteSession("current");
// 			console.log("🚀 ~ file: index.tsx:19 ~ logOut ~ result:", result);

// 			setUser(undefined);
// 		} catch (error) {
// 			console.log("error disconnecting.");
// 		} finally {
// 			setIsLoading(false);
// 		}
// 	};

// 	const [products, setProducts] = useState([]);
// 	const [loading, setLoading] = useState(true);
// 	const [refreshing, setRefreshing] = useState(false);


// 	useEffect(() => {
// 		fetchProducts();
// 	}, []);

// 	const fetchProducts = async () => {
// 		try {
// 			const response = await databases.listDocuments(
// 				DB_CONFIG.DATABASE_ID,
// 				DB_CONFIG.PRODUCTS_COLLECTION_ID,
// 				[Query.orderDesc('$createdAt')]
// 			);
// 			setProducts(response.documents);
// 		} catch (error) {
// 			console.log('Error fetching products:', error);
// 		} finally {
// 			setLoading(false);
// 			setRefreshing(false);
// 		}
// 	};

// 	const toggleFavorite = async (product) => {
// 		try {
// 			// Check if already favorited
// 			const favorites = await databases.listDocuments(
// 				DB_CONFIG.DATABASE_ID,
// 				DB_CONFIG.FAVORITES_COLLECTION_ID,
// 				[
// 					Query.equal('userId', user.$id),
// 					Query.equal('productId', product.$id)
// 				]
// 			);

// 			if (favorites.documents.length > 0) {
// 				// Remove from favorites
// 				await databases.deleteDocument(
// 					DB_CONFIG.DATABASE_ID,
// 					DB_CONFIG.FAVORITES_COLLECTION_ID,
// 					favorites.documents[0].$id
// 				);
// 				Alert.alert('Removed', 'Product removed from favorites');
// 			} else {

// 				console.log("product.price", product.price)
// 				// Add to favorites
// 				await databases.createDocument(
// 					DB_CONFIG.DATABASE_ID,
// 					DB_CONFIG.FAVORITES_COLLECTION_ID,
// 					ID.unique(),
// 					{
// 						userId: user.$id,
// 						productId: product.$id,
// 						productName: product.name,
// 						productPrice: product.price,
// 						productImage: product.image || null,
// 						createdAt: new Date().toISOString()
// 					}
// 				);
// 				Alert.alert('Added', 'Product added to favorites!');
// 			}
// 		} catch (error) {
// 			console.log('Error toggling favorite:', error);
// 			Alert.alert('Error', 'Failed to update favorites');
// 		}
// 	};

// 	const renderProduct = ({ item }) => (
// 		<View style={styles.productCard}>
// 			<Image
// 				source={{ uri: item.image || 'https://via.placeholder.com/150' }}
// 				style={styles.productImage}
// 			/>
// 			<View style={styles.productInfo}>
// 				<Text style={styles.productName}>{item.name}</Text>
// 				<Text style={styles.productDescription}>{item.description}</Text>
// 				<Text style={styles.productPrice}>{item.price} DA</Text>
// 			</View>
// 			<View style={styles.productActions}>
// 				<TouchableOpacity
// 					style={styles.favoriteButton}
// 					onPress={() => toggleFavorite(item)}
// 				>
// 					<OcticonsIcons name={"heart"} size={24} color={"black"} />
// 					{/* <Heart size={24} color="black" /> */}
// 				</TouchableOpacity>
// 				<TouchableOpacity
// 					style={styles.cartButton}
// 				// onPress={() => addToCart(item)}
// 				>
// 					<OcticonsIcons name={"container"} size={24} color={"black"} />
// 				</TouchableOpacity>
// 			</View>
// 		</View>
// 	);

// 	const onRefresh = () => {
// 		setRefreshing(true);
// 		fetchProducts();
// 	};

// 	if (loading) {
// 		return (
// 			<View  >
// 				<Text>Loading products...</Text>
// 			</View>
// 		);
// 	}

// 	return (
// 		<View
// 			style={{
// 				flex: 1,
// 				backgroundColor: theme.colors.background,
// 				alignItems: "center",
// 				justifyContent: "center",
// 			}}
// 		>
// 			<Text style={styles.screenTitle}>Produits</Text>
// 			<FlatList
// 				data={products}
// 				style={
// 					{
// 						width: "100%"
// 					}
// 				}
// 				contentContainerStyle={{
// 					width: "100%",
// 				}}
// 				renderItem={renderProduct}
// 				keyExtractor={item => item.$id}
// 				refreshControl={
// 					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
// 				}
// 				showsVerticalScrollIndicator={false}
// 			/>
// 		</View>
// 	);
// }

// const styles = StyleSheet.create({
// 	headerImage: {
// 		color: "#808080",
// 		bottom: -90,
// 		left: -35,
// 		position: "absolute",
// 	},
// 	titleContainer: {
// 		flexDirection: "row",
// 		gap: 8,
// 	},
// 	screenTitle: {
// 		fontSize: 24,
// 		fontWeight: 'bold',
// 		marginBottom: 20,
// 		color: '#2c3e50',
// 	},
// 	productCard: {
// 		backgroundColor: '#fff',
// 		borderRadius: 12,
// 		padding: 16,
// 		marginBottom: 16,
// 		flexDirection: 'row',
// 		alignItems: 'center',
// 		shadowColor: '#000',
// 		shadowOffset: {
// 			width: 0,
// 			height: 2,
// 		},
// 		shadowOpacity: 0.1,
// 		shadowRadius: 3.84,
// 		elevation: 5,
// 	},
// 	productImage: {
// 		width: 80,
// 		height: 80,
// 		borderRadius: 8,
// 		marginRight: 12,
// 	},
// 	productInfo: {
// 		flex: 1,
// 	},
// 	productName: {
// 		fontSize: 18,
// 		fontWeight: 'bold',
// 		color: '#2c3e50',
// 		marginBottom: 4,
// 	},
// 	productDescription: {
// 		fontSize: 14,
// 		color: '#7f8c8d',
// 		marginBottom: 8,
// 	},
// 	productPrice: {
// 		fontSize: 16,
// 		fontWeight: 'bold',
// 		color: '#27ae60',
// 	},
// 	productActions: {
// 		flexDirection: 'row',
// 		alignItems: 'center',
// 	},

// 	favoriteButton: {
// 		backgroundColor: '#db3434',
// 		padding: 8,
// 		marginRight: 8,
// 		borderRadius: 20,
// 	},
// 	cartButton: {
// 		backgroundColor: '#3498db',
// 		padding: 8,
// 		borderRadius: 20,
// 	},
// 	removeButton: {
// 		padding: 8,
// 	},
// });
