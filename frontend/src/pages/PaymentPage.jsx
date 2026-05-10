import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import axios from "axios";

const PaymentPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;
  
  // High Priority: Check if your Redux state actually has these fields!
  const user = useSelector((state) => state.auth.user);
  const access = useSelector((state) => state.auth.accessToken);

  const [paymentMethod, setPaymentMethod] = useState("online");
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);
  const [customAddress, setCustomAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state) { navigate("/cart"); return; }
    if (access === null) { navigate("/login"); }
  }, [state, access, navigate]);

  if (!state) return null; 
  const { cart, total } = state;

  const handleConfirmOrder = async () => {
    // Determine the shipping address
    const finalAddress = useDefaultAddress ? user?.address : customAddress;

    // VALIDATION: Prevent the "Required Path" error by checking values before sending
    if (!user?._id || !user?.email || !user?.phone) {
      return alert("User profile is incomplete. Please ensure you are logged in correctly with a phone and email.");
    }

    if (!finalAddress || finalAddress.trim() === "") {
      return alert("Please provide a valid shipping address");
    }

    setLoading(true);
    const config = { headers: { Authorization: `Bearer ${access}` } };

    // --- SHARED DATA OBJECT ---
    // This matches your Mongoose OrderSchema exactly
    const commonOrderData = {
      user: user?._id,
      email: user?.email,
      name: user?.name,
      phone: user?.phone,
      items: cart.map(item => ({
        product: item._id,
        product_name: item.product_name,
        quantity: item.qty,
        price: item.price
      })),
      total: total,
      shipAddress: finalAddress,
    };

    // --- CASE 1: CASH ON DELIVERY ---
    if (paymentMethod === "cod") {
      try {
        const res = await axios.post(`${API}/orders/create`, { 
          ...commonOrderData, 
          payment: "cod" 
        }, config);

        if (res.data.success) {
          alert("Order placed successfully via Cash on Delivery!");
          localStorage.removeItem("cart");
          navigate("/orders");
        }
      } catch (err) {
        alert("COD Error: " + (err.response?.data?.message || "Check required fields"));
      } finally {
        setLoading(false);
      }
      return; 
    }

    // --- CASE 2: ONLINE PAYMENT ---
    try {
      const { data } = await axios.post(`${API}/payment/checkout`, { amount: total }, config);
      
      const options = {
        key: RAZORPAY_KEY, 
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Yukti MyShop",
        description: "Secure Payment",
        order_id: data.order.id,
        handler: async function (response) {
          const verifyData = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderData: { ...commonOrderData, payment: "paid" }
          };

          const verifyRes = await axios.post(`${API}/payment/verify`, verifyData, config);
          if (verifyRes.data.success) {
            alert("Payment Successful!");
            localStorage.removeItem("cart");
            navigate("/orders");
          }
        },
        prefill: {
          name: user?.name || "Customer",
          email: user?.email || "",
          contact: user?.phone || ""
        },
        theme: { color: "#0d6efd" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      alert("Payment Error: " + (err.response?.data?.message || "Server Error"));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <h2 className="fw-bold mb-4">Checkout</h2>
            
            {/* Order Summary Block */}
            <div className="bg-light p-3 rounded-3 mb-4">
              <h5 className="fw-bold border-bottom pb-2">Order Summary</h5>
              {cart.map(item => (
                <div key={item._id} className="d-flex align-items-center justify-content-between py-2">
                  <div className="d-flex align-items-center">
                    <img src={`${API}${item.image}`} alt={item.product_name} width="50" height="50" className="rounded me-3 object-fit-cover" />
                    <div>
                      <p className="mb-0 fw-semibold">{item.product_name}</p>
                      <small className="text-muted">Qty: {item.qty}</small>
                    </div>
                  </div>
                  <span className="fw-bold">₹{item.price * item.qty}</span>
                </div>
              ))}
              <div className="d-flex justify-content-between mt-3 pt-2 border-top">
                <h5 className="fw-bold">Total:</h5>
                <h5 className="fw-bold text-success">₹{total}</h5>
              </div>
            </div>

            {/* ✅ NEW: Payment Method Selection */}
            <div className="mb-4">
              <h5 className="fw-bold mb-3">Choose Payment Method</h5>
              <div className="row g-2">
                <div className="col-6">
                  <div 
                    className={`p-3 border rounded-3 text-center cursor-pointer ${paymentMethod === 'online' ? 'border-primary bg-light text-primary' : ''}`}
                    onClick={() => setPaymentMethod('online')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="fs-3">💳</div>
                    <div className="fw-bold">Online Pay</div>
                  </div>
                </div>
                <div className="col-6">
                  <div 
                    className={`p-3 border rounded-3 text-center cursor-pointer ${paymentMethod === 'cod' ? 'border-primary bg-light text-primary' : ''}`}
                    onClick={() => setPaymentMethod('cod')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="fs-3">💵</div>
                    <div className="fw-bold">COD</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Selection Block */}
            <div className="mb-4">
              <h5 className="fw-bold mb-3">Shipping Address</h5>
              <div className={`form-check p-3 border rounded-3 mb-2 ${useDefaultAddress ? 'border-primary bg-light' : ''}`} onClick={() => setUseDefaultAddress(true)}>
                <input className="form-check-input ms-0 me-2" type="radio" checked={useDefaultAddress} readOnly />
                <label className="form-check-label fw-semibold">Use Registered: <p className="small text-muted mb-0">{user?.address || "No address found"}</p></label>
              </div>

              <div className={`form-check p-3 border rounded-3 ${!useDefaultAddress ? 'border-primary bg-light' : ''}`} onClick={() => setUseDefaultAddress(false)}>
                <input className="form-check-input ms-0 me-2" type="radio" checked={!useDefaultAddress} readOnly />
                <label className="form-check-label fw-semibold">Use Different Address</label>
                {!useDefaultAddress && (
                  <textarea className="form-control mt-2" rows="3" value={customAddress} onChange={(e) => setCustomAddress(e.target.value)} onClick={(e) => e.stopPropagation()} />
                )}
              </div>
            </div>

            <button className="btn btn-success btn-lg w-100 fw-bold py-3 rounded-3" onClick={handleConfirmOrder} disabled={loading}>
              {loading ? "Processing..." : paymentMethod === 'cod' ? "Confirm Order" : `Pay ₹${total}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;