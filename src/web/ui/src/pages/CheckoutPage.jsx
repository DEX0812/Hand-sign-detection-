import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, CreditCard, ArrowLeft, RefreshCw, CheckCircle, FileText, Download, QrCode, Smartphone } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : 'https://hand-sign-detection-4pz0.onrender.com');

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-6.02-4.53z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  // Selected plan from router state
  const selectedPlanId = location.state?.plan || 'monthly';
  
  // Payment methods state
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'upi', 'gpay'
  const [upiId, setUpiId] = useState('');

  // State for card input fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [zipCode, setZipCode] = useState('');
  
  // UI states
  const [focusedField, setFocusedField] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  // Plan info mapping
  const planInfo = {
    monthly: { name: 'Monthly Premium Plan', price: '$9.99', desc: 'Renews monthly.' },
    '6month': { name: '6-Month Premium Plan', price: '$49.99', desc: 'Billed every 6 months.' },
    yearly: { name: '1-Year Premium Plan', price: '$79.99', desc: 'Billed annually.' }
  }[selectedPlanId] || { name: 'Monthly Premium Plan', price: '$9.99', desc: 'Renews monthly.' };

  // Detect card network brand based on card number
  const getCardBrand = (num) => {
    const cleanNum = num.replace(/\s+/g, '');
    if (cleanNum.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(cleanNum)) return 'mastercard';
    if (/^3[47]/.test(cleanNum)) return 'amex';
    return 'generic';
  };

  const cardBrand = getCardBrand(cardNumber);

  // Format Card Number input: add spaces every 4 digits
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Numbers only
    if (value.length > 16) value = value.slice(0, 16);
    const formattedValue = value.match(/.{1,4}/g)?.join(' ') || '';
    setCardNumber(formattedValue);
  };

  // Format Expiry Date input: MM/YY
  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Numbers only
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 3) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardExpiry(value);
  };

  // Format CVV input: numbers only, max 4
  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    setCardCvv(value);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate inputs
    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 15) {
        setError('Please enter a valid credit card number.');
        return;
      }
      if (!cardName.trim()) {
        setError('Please enter the cardholder name.');
        return;
      }
      if (cardExpiry.length < 5) {
        setError('Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (cardCvv.length < 3) {
        setError('Please enter a valid CVV.');
        return;
      }
      if (zipCode.length < 5) {
        setError('Please enter a valid Zip Code.');
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId.trim()) {
        setError('Please enter your UPI ID.');
        return;
      }
      if (!/^[\w.-]+@[\w.-]+$/.test(upiId.trim())) {
        setError('Please enter a valid UPI ID (e.g. username@bank).');
        return;
      }
    }

    setIsLoading(true);

    try {
      // Simulate network request delays (realistic checkout loading)
      await new Promise(resolve => setTimeout(resolve, 2500));

      const res = await fetch(`${API_BASE_URL}/api/user/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, plan: selectedPlanId })
      });

      const data = await res.json();
      if (data.status === 'success') {
        let paymentDetail = '';
        if (paymentMethod === 'card') {
          paymentDetail = `Card (•••• ${cardNumber.slice(-4)})`;
        } else if (paymentMethod === 'upi') {
          paymentDetail = `UPI (${upiId.trim()})`;
        } else if (paymentMethod === 'gpay') {
          paymentDetail = 'Google Pay';
        }

        // Successful payment logic
        setSuccessData({
          transactionId: 'TXN-' + Math.floor(10000000 + Math.random() * 90000000),
          planName: planInfo.name,
          amountPaid: planInfo.price,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          paymentDetail: paymentDetail
        });
      } else {
        setError(data.message || 'Payment processor declined the request.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to payment processor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 flex justify-center items-center font-sans">
      <div className="max-w-4xl w-full flex flex-col">
        <button 
          onClick={() => navigate('/pricing')}
          className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white mb-8 self-start transition-colors uppercase tracking-wider"
        >
          <ArrowLeft size={16} /> Back to Pricing
        </button>

        <AnimatePresence mode="wait">
          {!successData ? (
            <motion.div 
              key="checkout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* LEFT: Payment details & input form */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="glass-strong p-8 rounded-4xl border border-white/10 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
                    <ShieldCheck size={18} /> Secure 256-Bit Payment Gateway
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
                      <Lock size={16} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-4">
                    {/* Payment Method Selector Tabs */}
                    <div className="grid grid-cols-3 gap-3 p-1 bg-white/5 rounded-2xl border border-white/5 mb-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all select-none cursor-pointer ${
                          paymentMethod === 'card' 
                            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black' 
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <CreditCard size={14} /> Card
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all select-none cursor-pointer ${
                          paymentMethod === 'upi' 
                            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black' 
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Smartphone size={14} /> UPI
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('gpay')}
                        className={`flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all select-none cursor-pointer ${
                          paymentMethod === 'gpay' 
                            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black' 
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <GoogleIcon /> <span className="font-extrabold -ml-0.5">Pay</span>
                      </button>
                    </div>

                    {paymentMethod === 'card' && (
                      <>
                        {/* Cardholder Name */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Cardholder Name</label>
                          <input 
                            type="text"
                            value={cardName}
                            onChange={e => setCardName(e.target.value)}
                            onFocus={() => setFocusedField('name')}
                            onBlur={() => setFocusedField('')}
                            placeholder="John Doe"
                            disabled={isLoading}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all text-sm font-semibold"
                          />
                        </div>

                        {/* Card Number */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Card Number</label>
                          <div className="relative">
                            <input 
                              type="text"
                              value={cardNumber}
                              onChange={handleCardNumberChange}
                              onFocus={() => setFocusedField('number')}
                              onBlur={() => setFocusedField('')}
                              placeholder="4000 1234 5678 9010"
                              disabled={isLoading}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all text-sm font-semibold font-mono"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
                              <CreditCard size={18} />
                            </div>
                          </div>
                        </div>

                        {/* Expiry, CVV, Zip */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Expiry</label>
                            <input 
                              type="text"
                              value={cardExpiry}
                              onChange={handleExpiryChange}
                              onFocus={() => setFocusedField('expiry')}
                              onBlur={() => setFocusedField('')}
                              placeholder="MM/YY"
                              disabled={isLoading}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all text-sm font-semibold font-mono text-center"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">CVV</label>
                            <input 
                              type="password"
                              value={cardCvv}
                              onChange={handleCvvChange}
                              onFocus={() => setFocusedField('cvv')}
                              onBlur={() => setFocusedField('')}
                              placeholder="***"
                              disabled={isLoading}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all text-sm font-semibold font-mono text-center"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Zip Code</label>
                            <input 
                              type="text"
                              value={zipCode}
                              onChange={e => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                              onFocus={() => setFocusedField('zip')}
                              onBlur={() => setFocusedField('')}
                              placeholder="90210"
                              disabled={isLoading}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all text-sm font-semibold font-mono text-center"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {paymentMethod === 'upi' && (
                      <div className="flex flex-col gap-4">
                        {/* UPI ID */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">UPI ID / VPA</label>
                          <input 
                            type="text"
                            value={upiId}
                            onChange={e => setUpiId(e.target.value)}
                            placeholder="username@okhdfcbank"
                            disabled={isLoading}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all text-sm font-semibold font-mono"
                          />
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-start gap-3 text-white/40 text-xs">
                          <Smartphone size={16} className="shrink-0 text-teal-400 mt-0.5" />
                          <span>
                            A collect request will be sent to your UPI app. Open Google Pay, PhonePe, Paytm, or BHIM app to complete authorization.
                          </span>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'gpay' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col items-center justify-center py-6 px-4 bg-white/[0.02] border border-white/5 rounded-3xl gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                            <ShieldCheck size={24} />
                          </div>
                          <div className="text-center">
                            <h4 className="text-sm font-bold text-white mb-1 font-sans">Single-Click Google Pay Checkout</h4>
                            <p className="text-xs text-white/40 max-w-sm font-sans">
                              Pay instantly and securely using credit cards and digital tokens synced to your Google Account.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-4.5 rounded-2xl font-bold uppercase tracking-widest mt-4 relative overflow-hidden transition-all antigravity-lift ${
                        isLoading ? 'bg-zinc-800 text-white/30 cursor-not-allowed border border-white/5' : 'bg-emerald-500 hover:bg-emerald-400 text-black cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                      }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <RefreshCw size={16} className="animate-spin" /> {
                            paymentMethod === 'card' ? 'Verifying Credentials...' :
                            paymentMethod === 'upi' ? 'Requesting PSP Authorization...' :
                            'Contacting Google Pay Secure Gateway...'
                          }
                        </span>
                      ) : (
                        paymentMethod === 'card' ? `Authorize Payment - ${planInfo.price}` :
                        paymentMethod === 'upi' ? `Request UPI Collect - ${planInfo.price}` :
                        `Pay with Google Pay - ${planInfo.price}`
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* RIGHT: Visual credit card mockup & order summary */}
              <div className="lg:col-span-5 flex flex-col gap-8">
                {/* Dynamic Payment Method Visual Mockup */}
                <div className="w-full h-[220px]">
                  <AnimatePresence mode="wait">
                    {paymentMethod === 'card' && (
                      <motion.div
                        key="card-mockup"
                        initial={{ opacity: 0, rotateY: -60, scale: 0.95 }}
                        animate={{ opacity: 1, rotateY: focusedField === 'cvv' ? 180 : 0, scale: 1 }}
                        exit={{ opacity: 0, rotateY: 60, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                        style={{ transformStyle: 'preserve-3d' }}
                        className="w-full h-full relative cursor-pointer perspective-1000"
                      >
                        {/* Card Front */}
                        <div 
                          style={{ backfaceVisibility: 'hidden' }}
                          className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-zinc-900 via-neutral-900 to-zinc-800 border border-white/15 p-6 flex flex-col justify-between shadow-2xl overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />
                          
                          <div className="flex justify-between items-start">
                            <div className="w-12 h-9 bg-yellow-600/30 rounded-lg border border-yellow-500/20" /> {/* Chip */}
                            
                            {/* Dynamic Brand Logo */}
                            <div className="text-right">
                              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 block">NEURAL CARD</span>
                              <span className="text-xs font-bold text-white uppercase italic">
                                {cardBrand === 'visa' && 'VISA'}
                                {cardBrand === 'mastercard' && 'MASTERCARD'}
                                {cardBrand === 'amex' && 'AMEX'}
                                {cardBrand === 'generic' && 'SECURE'}
                              </span>
                            </div>
                          </div>

                          {/* Card Number display */}
                          <div className="text-xl font-mono tracking-widest text-white/95 my-2">
                            {cardNumber || '•••• •••• •••• ••••'}
                          </div>

                          <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                              <span className="text-[7px] font-bold text-white/30 uppercase tracking-widest leading-none mb-1">CARDHOLDER</span>
                              <span className="text-xs font-bold text-white/80 tracking-wide uppercase truncate max-w-[150px]">
                                {cardName || 'JOHN DOE'}
                              </span>
                            </div>
                            
                            <div className="flex flex-col items-end">
                              <span className="text-[7px] font-bold text-white/30 uppercase tracking-widest leading-none mb-1">EXPIRES</span>
                              <span className="text-xs font-mono text-white/80">
                                {cardExpiry || 'MM/YY'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Back */}
                        <div 
                          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                          className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-zinc-800 via-neutral-900 to-zinc-900 border border-white/15 py-6 flex flex-col justify-between shadow-2xl"
                        >
                          <div className="w-full h-10 bg-black mt-2" />
                          
                          <div className="px-6 flex flex-col">
                            <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded px-3 py-2 text-right">
                              <span className="text-[8px] font-mono text-white/20 italic">AUTHORIZED SIGNATURE</span>
                              <span className="text-sm font-mono font-bold text-white tracking-widest">
                                {cardCvv || '•••'}
                              </span>
                            </div>
                            <p className="text-[6px] text-white/20 mt-4 leading-normal leading-tight font-sans">
                              This neural access key remains the property of SignVision AI. Access usage is monitored and encrypted via AES-256 protocols.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {paymentMethod === 'upi' && (
                      <motion.div
                        key="upi-mockup"
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="w-full h-full rounded-3xl bg-gradient-to-tr from-zinc-900 via-neutral-900 to-zinc-800 border border-white/15 p-6 flex items-center justify-between shadow-2xl overflow-hidden relative"
                      >
                        <div className="absolute top-0 right-0 w-36 h-36 bg-sky-500/5 rounded-full filter blur-3xl pointer-events-none" />
                        
                        {/* QR Code and Smartphone Mock */}
                        <div className="flex items-center gap-6 w-full relative z-10">
                          {/* QR Code Container */}
                          <div className="relative bg-white p-3 rounded-2xl shadow-xl w-32 h-32 flex items-center justify-center shrink-0 overflow-hidden">
                            <QrCode size={100} className="text-black" />
                            {/* Scanning indicator */}
                            <motion.div 
                              animate={{ y: [0, 110, 0] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_#10b981]"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Instant UPI Sync</span>
                            <h4 className="text-sm font-bold text-white">Scan QR Code</h4>
                            <p className="text-[10px] text-white/50 leading-relaxed">
                              Scan this secure dynamic QR with Google Pay, PhonePe, Paytm, or any UPI app to initiate payment.
                            </p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[8px] font-bold py-1 px-2 rounded-md bg-white/5 border border-white/10 text-white/60">BHIM UPI</span>
                              <span className="text-[8px] font-bold py-1 px-2 rounded-md bg-white/5 border border-white/10 text-white/60">SECURE 3D</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {paymentMethod === 'gpay' && (
                      <motion.div
                        key="gpay-mockup"
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="w-full h-full rounded-3xl bg-gradient-to-tr from-zinc-900 via-neutral-900 to-zinc-800 border border-white/15 p-6 flex flex-col justify-between shadow-2xl overflow-hidden relative"
                      >
                        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />
                        
                        <div className="flex justify-between items-start z-10">
                          <div className="flex items-center gap-1.5">
                            <GoogleIcon />
                            <span className="text-sm font-black text-white uppercase tracking-wider">Pay</span>
                          </div>
                          <span className="text-[8px] font-bold py-1 px-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            VERIFIED UPLINK
                          </span>
                        </div>

                        {/* Digital Wallet Card look */}
                        <div className="my-3 flex items-center gap-4 bg-white/[0.03] border border-white/5 rounded-2xl p-4 z-10 w-full">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                            <ShieldCheck size={20} />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-none">Security Protocol</span>
                            <h5 className="text-xs font-bold text-white mt-1">Tokenized Credentials</h5>
                            <p className="text-[9px] text-white/40 leading-normal mt-0.5">
                              Your device token holds encrypted card details for faster transaction clearing.
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[9px] text-white/30 border-t border-white/5 pt-3 z-10 w-full">
                          <span>FAST CHECKOUT</span>
                          <span>POWERED BY GOOGLE PAY</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Order Summary Box */}
                <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col gap-4 shadow-xl">
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.25em] font-display">Order Summary</span>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white/80">{planInfo.name}</span>
                    <span className="text-sm font-bold text-white">{planInfo.price}</span>
                  </div>

                  <p className="text-[10px] text-white/40 leading-relaxed font-sans -mt-2">
                    {planInfo.desc} Access is activated immediately upon authorization.
                  </p>

                  <div className="h-px bg-white/5" />

                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-white/60">Total Due Today</span>
                    <span className="text-emerald-400 text-lg font-display">{planInfo.price}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Successful Checkout Receipt View */
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto glass p-8 rounded-4xl border border-emerald-500/20 shadow-2xl flex flex-col items-center text-center gap-6"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle size={36} className="animate-bounce" />
              </div>

              <div>
                <h3 className="text-2xl font-bold font-display text-white">Payment Authorized</h3>
                <p className="text-xs text-white/50 mt-1">Uplink initialized. Subscription is fully active.</p>
              </div>

              {/* Receipt */}
              <div className="w-full bg-black/30 border border-white/5 rounded-3xl p-6 flex flex-col gap-4 text-left font-mono text-xs text-white/80">
                <div className="flex items-center gap-2 text-[10px] text-white/40 border-b border-white/5 pb-2 uppercase tracking-wider font-sans font-bold">
                  <FileText size={12} /> Transaction Receipt
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">Invoice ID</span>
                  <span>{successData.transactionId}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">Uplink Tier</span>
                  <span className="font-bold text-white">{successData.planName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">Amount Charged</span>
                  <span className="text-emerald-400 font-bold">{successData.amountPaid}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">Billing Date</span>
                  <span>{successData.date}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">Charged To</span>
                  <span className="text-white font-bold">{successData.paymentDetail}</span>
                </div>
              </div>

              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => navigate('/detector')}
                  className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer select-none text-center"
                >
                  Access Detector
                </button>
                <button 
                  onClick={() => navigate('/profile')}
                  className="py-4 px-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-2xl transition-all cursor-pointer select-none text-center"
                >
                  My Profile
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
