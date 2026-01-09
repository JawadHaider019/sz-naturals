"use client";

import React, { useState, useRef, useEffect } from "react";

const faqTree = {
  "What is Pure Clay?": {
    answer:
      "Pure Clay is a natural and organic brand from Pakistan, offering pure, healthy, and wholesome products made from nature's finest ingredients.",
    followups: {
      "What kind of products do you offer?": {
        answer:
          "We offer a variety of natural products including cold-pressed oils, organic nuts, dates, and herbal blends — all made from 100% pure, plant-based ingredients.",
      },
      "Where are your products made?": {
        answer:
          "All Pure Clay products are proudly made in Pakistan, using locally sourced and carefully selected ingredients.",
      },
    },
  },

  "Are your products 100% natural?": {
    answer:
      "Yes! All our products are made from 100% natural, plant-based ingredients — free from preservatives, chemicals, and artificial additives.",
    followups: {
      "Do you use any preservatives or artificial flavors?": {
        answer:
          "No. We never use preservatives, artificial colors, or synthetic flavors in any of our products.",
      },
      "Are your products safe for daily use?": {
        answer:
          "Absolutely! Our products are completely safe for daily use and suitable for the whole family.",
      },
    },
  },

  "What makes Pure Clay different?": {
    answer:
      "Pure Clay focuses on purity, transparency, and sustainability. Every product is crafted to preserve natural goodness and promote a healthier, balanced lifestyle.",
    followups: {
      "Do you use eco-friendly packaging?": {
        answer:
          "Yes. We use eco-conscious, recyclable packaging materials to minimize environmental impact.",
      },
      "Do you support local farmers?": {
        answer:
          "Yes. We work closely with trusted local farmers and suppliers across Pakistan to source the best organic ingredients.",
      },
    },
  },

  "How can I order your products?": {
    answer:
      "You can place your order directly through our website. Simply browse our collection, add products to your cart, and proceed to checkout.",
    followups: {
      "Do you deliver across Pakistan?": {
        answer:
          "Yes, we deliver to all major cities and regions across Pakistan.",
      },
      "How long does delivery take?": {
        answer:
          "Delivery usually takes 3–5 working days, depending on your location.",
      },
    },
  },

  "What payment methods do you accept?": {
    answer:
      "We accept Cash on Delivery (COD) and online payments through secure gateways for your convenience.",
    followups: {
      "Is online payment safe?": {
        answer:
          "Yes, all online payments are processed through trusted, encrypted platforms for your safety.",
      },
    },
  },

  "Can I return or exchange a product?": {
    answer:
      "Yes, if you receive a damaged or incorrect product, you can request a return or exchange within 7 days of delivery.",
    followups: {
      "How can I request a return?": {
        answer:
          "Simply contact our support team with your order details, and we'll guide you through the process.",
      },
    },
  },

  "Are Pure Clay products certified organic?": {
    answer:
      "We ensure our ingredients meet the highest natural and organic standards through strict sourcing and testing practices.",
    followups: {
      "Do you test on animals?": {
        answer: "No. We are 100% cruelty-free and do not test on animals.",
      },
    },
  },

  "How should I store Pure Clay products?": {
    answer:
      "Store our products in a cool, dry place away from direct sunlight to preserve their natural freshness and quality.",
  },

  "How can I contact Pure Clay?": {
    answer:
      "You can reach us via email at ahmed@pureclay.com or call +923260325475 / +923329780355. You can also contact us through the website contact page.",
    followups: {
      "Where is Pure Clay located?": {
        answer: "We are based in Chakwal, Pakistan.",
      },
    },
  },
};

export default function FaqBot() {
  const [messages, setMessages] = useState([
    { type: "bot", text: "Hi! How can I help you today?" },
  ]);
  const [options, setOptions] = useState(Object.keys(faqTree));
  const [open, setOpen] = useState(false);
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false);
  const messagesEndRef = useRef(null);

  // Floating animation state
  const [isFloatingUp, setIsFloatingUp] = useState(true);

  // Floating animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFloatingUp(prev => !prev);
    }, 1500); // Change direction every 1.5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleClick = (question) => {
    const currentNode =
      faqTree[question] || findNodeInFollowups(faqTree, question);
    if (!currentNode) return;

    setMessages((prev) => [
      ...prev,
      { type: "user", text: question },
      { type: "bot", text: currentNode.answer },
    ]);

    if (currentNode.followups) {
      setOptions(Object.keys(currentNode.followups));
    } else {
      setOptions([]);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { 
            type: "bot", 
            text: "Need more help? Feel free to ask or contact us directly on WhatsApp!" 
          },
        ]);
        setShowWhatsAppPrompt(true);
        setOptions(["Ask another question", "Contact on WhatsApp"]);
      }, 600);
    }
  };

  const handleOptionClick = (option) => {
    if (option === "Ask another question") {
      setOptions(Object.keys(faqTree));
      setShowWhatsAppPrompt(false);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "What else would you like to know?" },
      ]);
    } else if (option === "Contact on WhatsApp") {
      // Open WhatsApp
      window.open("https://wa.me/923329780355", "_blank");
    } else {
      handleClick(option);
    }
  };

  const findNodeInFollowups = (tree, question) => {
    for (const mainKey in tree) {
      const followups = tree[mainKey].followups || {};
      if (followups[question]) return followups[question];
      const deeper = findNodeInFollowups(followups, question);
      if (deeper) return deeper;
    }
    return null;
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const popupRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Handle mobile back button
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  const openWhatsApp = () => {
    window.open("https://wa.me/923329780355", "_blank");
  };

  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 z-[9998] bg-black/20 md:bg-black/10 backdrop-blur-sm"
          aria-label="Close FAQ Bot" 
        />
      )}
      <div className="fixed bottom-6 right-4 md:bottom-12 md:right-6 z-[9999]">
        {open ? (
          <div
            ref={popupRef}
            className="w-[95vw] max-w-[400px] h-[85vh] max-h-[600px] md:w-[350px] md:h-[550px] bg-white shadow-2xl border border-gray-200 rounded-3xl flex flex-col p-0 overflow-hidden animate-fadeIn mx-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 md:px-5 py-3 md:py-4 bg-black text-white rounded-t-3xl">
              <h2 className="font-bold text-base md:text-lg">💬 FAQ Bot</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-xs md:text-sm font-semibold bg-white/10 hover:bg-white/20 px-2 md:px-3 py-1 rounded-full text-white transition"
              >
                x
              </button>
            </div>
            
            {/* Chat Area */}
            <div 
              className="flex-1 overflow-y-auto px-3 md:px-4 py-2 md:py-3 space-y-2 bg-gray-50"
              style={{ minHeight: 0 }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-xs md:text-sm p-2 md:p-3 rounded-xl max-w-[90%] md:max-w-[85%] ${
                    msg.type === "bot"
                      ? "bg-green-100 text-green-900 self-start"
                      : "bg-blue-100 text-blue-900 self-end text-right"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Options */}
            <div className="px-3 md:px-4 py-2 md:py-3 bg-white border-t border-gray-200 space-y-1 md:space-y-2 max-h-[40%] overflow-y-auto">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleOptionClick(opt)}
                  className={`w-full px-2 md:px-3 py-2 text-xs md:text-sm font-semibold rounded-lg md:rounded-xl hover:scale-105 transition text-left break-words ${
                    opt === "Contact on WhatsApp" 
                      ? "bg-green-600 text-white hover:bg-green-700" 
                      : opt === "Ask another question"
                      ? "bg-gray-600 text-white hover:bg-gray-700"
                      : "bg-black text-white hover:from-black hover:to-teal-900"
                  }`}
                >
                  {opt === "Contact on WhatsApp" && "📱 "}
                  {opt}
                </button>
              ))}
              
              {/* WhatsApp Quick Contact */}
              {showWhatsAppPrompt && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-800 mb-2">Need immediate help?</p>
                  <button
                    onClick={openWhatsApp}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                  >
                    <span>📱</span>
                    Chat on WhatsApp
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className={`
              bg-black text-white px-4 py-3 md:px-6 md:py-4 rounded-full shadow-2xl font-bold text-sm md:text-lg 
              hover:scale-105 transition active:scale-95
              ${isFloatingUp ? 'translate-y-0' : 'translate-y-1'}
              transition-transform duration-1000 ease-in-out
            `}
            style={{
              transform: isFloatingUp ? 'translateY(0px)' : 'translateY(6px)'
            }}
          >
            <span className="hidden sm:inline">💬 Need Help?</span>
            <span className="sm:hidden">💬</span>
          </button>
        )}
      </div>
    </>
  );
}