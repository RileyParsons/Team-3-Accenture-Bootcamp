'use client';

interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  recipeIds: string[];
}

interface ShoppingListStore {
  storeName: string;
  items: ShoppingListItem[];
  subtotal: number;
}

interface ShoppingList {
  stores: ShoppingListStore[];
  totalCost: number;
}

interface ShoppingListProps {
  shoppingList: ShoppingList;
}

export default function ShoppingList({ shoppingList }: ShoppingListProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shopping List</h2>

      {shoppingList.stores.length === 0 ? (
        <p className="text-gray-600">No items in shopping list</p>
      ) : (
        <div className="space-y-6">
          {shoppingList.stores.map((store) => (
            <div key={store.storeName} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{store.storeName}</h3>

              <div className="space-y-2">
                {store.items.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex-1">
                      <span className="text-gray-900 font-medium">{item.name}</span>
                      <span className="text-gray-600 ml-2">
                        ({item.quantity} {item.unit})
                      </span>
                    </div>
                    <div className="text-gray-900 font-semibold">
                      ${item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-300 flex justify-between items-center">
                <span className="text-gray-900 font-semibold">Store Subtotal:</span>
                <span className="text-gray-900 font-bold text-lg">
                  ${store.subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          ))}

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-900 font-bold text-xl">Total Weekly Cost:</span>
              <span className="text-green-700 font-bold text-2xl">
                ${shoppingList.totalCost.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
