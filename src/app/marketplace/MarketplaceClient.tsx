'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Search, MapPin, Store, Plus, ShoppingBag } from 'lucide-react'
import ProductCard from '@/components/marketplace/ProductCard'
import AddProductModal from '@/components/marketplace/AddProductModal'

interface MarketplaceClientProps {
  initialProducts: any[]
  currentUser: any
  isAdmin: boolean
}

export default function MarketplaceClient({ initialProducts, currentUser, isAdmin }: MarketplaceClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [products, setProducts] = useState<any[]>(initialProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Sync state if initialProducts changes server-side
  useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])

  const refreshProducts = async () => {
    setIsRefreshing(true)
    try {
      // 1. Trigger Server Component revalidation
      router.refresh()

      // 2. Fetch directly client-side for instant reactive update
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles:seller_id(id, full_name, role, avatar_cloudinary_url, phone)
        `)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setProducts(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const categories = [
    'All',
    'Electronics',
    'Hardware & Tools',
    'Construction Materials',
    'Fashion',
    'Home Goods',
    'Other'
  ]

  // Filter products client-side for fluid performance
  const filteredProducts = products.filter((prod) => {
    const matchesSearch = prod.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory
    
    const matchesLocation = !selectedLocation || 
                            prod.location.toLowerCase().includes(selectedLocation.toLowerCase())

    return matchesSearch && matchesCategory && matchesLocation
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-8">
      {/* Top Banner section */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
            <Store className="h-3.5 w-3.5" />
            Marketplace
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            Local Business & Product Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Browse tools, hardware, construction materials, electronics, and fashion items. Buy directly from verified local businesses and providers in Sierra Leone.
          </p>
        </div>

        {currentUser ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-3 text-xs shadow-sm hover:shadow transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Sell a Product</span>
          </button>
        ) : (
          <button
            onClick={() => router.push('/login?redirectTo=/marketplace')}
            className="flex items-center gap-2 rounded-full bg-zinc-850 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-200 font-bold px-5 py-3 text-xs shadow-sm transition-all cursor-pointer shrink-0"
          >
            <span>Sign In to Sell</span>
          </button>
        )}
      </div>

      {/* Filter panel */}
      <div className="flex flex-col gap-4">
        {/* Search & Location inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute top-3 left-3.5 h-4.5 w-4.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search products by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-zinc-250 bg-white py-3 pl-10 pr-4 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute top-3 left-3.5 h-4.5 w-4.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter by location (e.g. Lumley)..."
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full rounded-full border border-zinc-250 bg-white py-3 pl-10 pr-4 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white"
            />
          </div>
        </div>

        {/* Category Pills list */}
        <div className="flex flex-wrap gap-2 pt-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all border cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-white hover:bg-zinc-50 border-zinc-250 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-850'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid stream */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-12 text-center shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 max-w-md mx-auto">
          <ShoppingBag className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-1">
            No products listed yet
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
            Try matching a different keyword search or category filter. If you're a local seller, list your first product now!
          </p>
          {currentUser && (
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-2 text-xs transition-colors cursor-pointer"
            >
              List your product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              currentUser={currentUser}
              isAdmin={isAdmin}
              onProductDeleted={refreshProducts}
            />
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onProductCreated={refreshProducts}
        />
      )}
    </div>
  )
}
