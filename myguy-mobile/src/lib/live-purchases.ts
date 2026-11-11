import Purchases from 'react-native-purchases'
import { Platform } from 'react-native'

let initialization: Promise<void> | null = null

async function ensurePurchasesReady(userId: string) {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    throw new Error('Coin purchases are available in the MyGuy mobile app.')
  }
  const apiKey = Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
  if (!apiKey) throw new Error('In-app purchases are not configured for this build.')

  if (!initialization) {
    initialization = (async () => {
      if (!(await Purchases.isConfigured())) {
        Purchases.configure({ apiKey, appUserID: userId })
        return
      }
      if ((await Purchases.getAppUserID()) !== userId) {
        await Purchases.logIn(userId)
      }
    })()
  }
  try {
    await initialization
  } catch (error) {
    initialization = null
    throw error
  }

  if ((await Purchases.getAppUserID()) !== userId) {
    await Purchases.logIn(userId)
  }
}

export async function getLiveCoinStoreProducts(userId: string) {
  await ensurePurchasesReady(userId)
  return Purchases.getProducts(
    ['myguy.coins.100', 'myguy.coins.550', 'myguy.coins.1200'],
    Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION
  )
}

export async function buyLiveCoinProduct(userId: string, productIdentifier: string) {
  await ensurePurchasesReady(userId)
  const products = await Purchases.getProducts(
    [productIdentifier],
    Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION
  )
  const product = products.find((item) => item.identifier === productIdentifier)
  if (!product) throw new Error('That coin package is not available in your app store.')
  await Purchases.purchaseStoreProduct(product)
}
