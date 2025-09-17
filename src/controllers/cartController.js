import Cart from "../models/Cart.js";
import Product from "../models/Product.js";


// 📌 Kullanıcının sepetini getir
export const getUserCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart) return res.status(200).json({ items: [] });

    res.status(200).json(cart.items);
  } catch (error) {
    res.status(500).json({ message: "🚨 Sepet yüklenirken hata oluştu!", error: error.message });
  }
};

// ✅ **Sepete Ürün Ekleme**
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, price, title, images = [] } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "🚨 Ürün ID eksik!" });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      // Sepette ürün varsa, miktarını artır.
      const existingItem = cart.items.find(item => item.product.toString() === productId);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({
          product: productId,
          quantity,
          price: req.body.price,
          title: req.body.title,
          images
        });
      }

      await cart.save();
      return res.status(200).json({ message: "✅ Sepet güncellendi!", cart });
    } else {
      // Sepet henüz yoksa yeni oluştur.
      const newCart = await Cart.create({
        user: req.user._id,
        items: [{ product: productId, quantity, price: req.body.price, title: req.body.title, images: req.body.images || [] }],
      });

      res.status(201).json({ message: "✅ Ürün sepete eklendi!", cart: newCart });
    }
  } catch (error) {
    res.status(500).json({ message: "🚨 Ürün sepete eklenemedi!", error: error.message });
  }
};





// 🔺 **Miktar Artır**
export const increaseQuantity = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "🚨 Sepet bulunamadı!" });

    const item = cart.items.find((item) => item.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: "🚨 Ürün bulunamadı!" });

    item.quantity += 1;
    await cart.save();
    res.status(200).json(cart.items);
  } catch (error) {
    res.status(500).json({ message: "🚨 Miktar artırılamadı!", error: error.message });
  }
};

// 🔻 **Miktar Azalt**
export const decreaseQuantity = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "🚨 Sepet bulunamadı!" });

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === req.params.productId);
    if (itemIndex === -1) return res.status(404).json({ message: "🚨 Ürün bulunamadı!" });

    if (cart.items[itemIndex].quantity > 1) {
      cart.items[itemIndex].quantity -= 1;
    } else {
      cart.items.splice(itemIndex, 1);
    }

    await cart.save();
    res.status(200).json(cart.items);
  } catch (error) {
    res.status(500).json({ message: "🚨 Miktar azaltılamadı!", error: error.message });
  }
};

// ❌ **Sepetten Ürün Kaldır**
export const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "🚨 Sepet bulunamadı!" });

    cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
    await cart.save();

    res.status(200).json(cart.items);
  } catch (error) {
    res.status(500).json({ message: "🚨 Ürün sepetten kaldırılamadı!", error: error.message });
  }
};

// 🗑️ **Sepeti Temizle**
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "🚨 Sepet bulunamadı!" });

    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "✅ Sepet başarıyla temizlendi!" });
  } catch (error) {
    res.status(500).json({ message: "🚨 Sepet temizlenemedi!", error: error.message });
  }
};
