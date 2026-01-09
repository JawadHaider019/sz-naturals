import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Deal from "../models/dealModel.js";
import User from "../models/userModel.js";

/**
 * MAIN DASHBOARD STATS CONTROLLER - USING ACTUAL ORDER DATA
 */
export const getDashboardStats = async (req, res) => {
  try {
    const { timeRange = 'monthly' } = req.query;
    const dateRange = getDateRange(timeRange);
    const startTimestamp = dateRange.start.getTime();
    const endTimestamp = dateRange.end.getTime();

    // Fetch all data
    const allProducts = await Product.find({});
    
    // 🔴 CRITICAL FIX: Filter out cancelled and rejected orders
    const allOrders = await Order.find({ 
      date: { $gte: startTimestamp, $lte: endTimestamp },
      status: { $nin: ['Cancelled', 'Payment Rejected'] }, // Exclude cancelled/rejected orders
      paymentStatus: { $ne: 'rejected' } // Also exclude payment rejected
    });
    
    const allUsers = await User.find({});
    const allDeals = await Deal.find({});

    // 1️⃣ BASIC COUNTS
    const totalOrders = allOrders.length;
    const totalProducts = allProducts.length;
    const totalDeals = allDeals.length;

    // 2️⃣ REVENUE & COST CALCULATION - USING ACTUAL ORDER DATA
    let totalProductRevenue = 0;
    let totalDealRevenue = 0;
    let totalProductCost = 0;
    let totalDealCost = 0;
    let totalItemsSold = 0;
    let dealsSold = 0;
    let productsSold = 0;

    // Calculate metrics from actual order data (already filtered to exclude cancelled)
    for (const order of allOrders) {
      for (const item of order.items) {
        const quantity = item.quantity || 1;
        totalItemsSold += quantity;

        if (item.isFromDeal) {
          // This is a deal item
          totalDealRevenue += (item.price || 0) * quantity;
          dealsSold += quantity;
          
          // Calculate deal cost - use actual cost if available, otherwise estimate
          if (item.cost) {
            totalDealCost += item.cost * quantity;
          } else {
            // Estimate cost for deal items
            totalDealCost += (item.price || 0) * 0.6 * quantity;
          }
        } else {
          // This is a regular product item
          totalProductRevenue += (item.price || 0) * quantity;
          productsSold += quantity;
          
          // Calculate product cost
          if (item.cost) {
            totalProductCost += item.cost * quantity;
          } else if (item.productId) {
            const product = await Product.findById(item.productId);
            if (product) {
              totalProductCost += product.cost * quantity;
            } else {
              totalProductCost += (item.price || 0) * 0.6 * quantity;
            }
          } else {
            totalProductCost += (item.price || 0) * 0.6 * quantity;
          }
        }
      }
    }

    // 3️⃣ PROFIT CALCULATIONS
    const totalProductProfit = totalProductRevenue - totalProductCost;
    const totalDealProfit = totalDealRevenue - totalDealCost;
    const totalRevenue = totalProductRevenue + totalDealRevenue;
    const totalCost = totalProductCost + totalDealCost;
    const totalProfit = totalProductProfit + totalDealProfit;

    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;
    const productProfitMargin = totalProductRevenue > 0 ? ((totalProductProfit / totalProductRevenue) * 100) : 0;
    const dealProfitMargin = totalDealRevenue > 0 ? ((totalDealProfit / totalDealRevenue) * 100) : 0;

    // 4️⃣ PENDING ORDERS
    const pendingOrders = allOrders.filter(order => 
      ["Order Placed", "Packing", "Processing"].includes(order.status)
    ).length;

    // 5️⃣ INVENTORY VALUE
    const inventoryValue = allProducts.reduce((acc, product) => {
      return acc + (product.cost * product.quantity);
    }, 0);

    // 6️⃣ DEAL INVENTORY VALUE
    const dealInventoryValue = allDeals.reduce((acc, deal) => {
      const dealCost = (deal.dealProducts || []).reduce((sum, product) => {
        const productCost = product.cost || 0;
        const quantity = product.quantity || 0;
        return sum + (productCost * quantity);
      }, 0);
      return acc + dealCost;
    }, 0);

    // 7️⃣ RECENT ORDERS (last 6)
    const recentOrders = await Order.find({ 
      status: { $nin: ['Cancelled', 'Payment Rejected'] },
      paymentStatus: { $ne: 'rejected' }
    })
      .sort({ date: -1 })
      .limit(6)
      .populate('userId', 'name');

    const enhancedRecentOrders = recentOrders.map(order => ({
      _id: order._id,
      user: {
        name: order.userId?.name || 'Unknown Customer',
        location: order.address?.city || 'Unknown'
      },
      amount: order.amount,
      status: order.status,
      createdAt: new Date(order.date).toISOString(),
      items: order.items.map(item => ({
        name: item.name || 'Product',
        quantity: item.quantity || 1
      }))
    }));

    // 8️⃣ TOP PRODUCTS - BASED ON ACTUAL SALES FROM ORDERS
    const productSales = {};
    
    // Calculate actual product sales from orders
    for (const order of allOrders) {
      for (const item of order.items) {
        if (!item.isFromDeal) {
          const productName = item.name;
          if (productName && productName !== 'Generic Item') {
            if (!productSales[productName]) {
              productSales[productName] = {
                name: productName,
                totalSales: 0,
                revenue: 0
              };
            }
            productSales[productName].totalSales += item.quantity || 1;
            productSales[productName].revenue += (item.price || 0) * (item.quantity || 1);
          }
        }
      }
    }

    // Get product details for top products
    const topProductsData = Object.values(productSales)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 6);

    const topProducts = await Promise.all(
      topProductsData.map(async (salesData) => {
        // Find the product by name
        const product = allProducts.find(p => p.name === salesData.name);
        if (product) {
          return {
            _id: product._id,
            name: product.name,
            category: product.category,
            price: product.price,
            cost: product.cost,
            quantity: product.quantity,
            totalSales: salesData.totalSales,
            discountprice: product.discountprice
          };
        } else {
          // If product not found, create a basic object
          return {
            _id: salesData.name,
            name: salesData.name,
            category: 'Unknown',
            price: 0,
            cost: 0,
            quantity: 0,
            totalSales: salesData.totalSales,
            discountprice: 0
          };
        }
      })
    );

    // If no sales data, use product quantity as fallback
    if (topProducts.length === 0) {
      topProducts.push(...allProducts
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 6)
        .map(product => ({
          _id: product._id,
          name: product.name,
          category: product.category,
          price: product.price,
          cost: product.cost,
          quantity: product.quantity,
          totalSales: product.totalSales || 0,
          discountprice: product.discountprice
        }))
      );
    }

    // 9️⃣ LOW STOCK PRODUCTS
    const lowStockProducts = allProducts
      .filter(product => product.quantity < 10 && product.quantity > 0)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5)
      .map(product => ({
        _id: product._id,
        name: product.name,
        quantity: product.quantity,
        cost: product.cost,
        idealStock: 20,
        category: product.category,
        price: product.price
      }));

    // 🔟 CUSTOMER INSIGHTS
    const totalCustomers = allUsers.length;
    
    const customerOrders = await Order.aggregate([
      { 
        $match: { 
          date: { $gte: startTimestamp, $lte: endTimestamp },
          status: { $nin: ['Cancelled', 'Payment Rejected'] },
          paymentStatus: { $ne: 'rejected' }
        } 
      },
      {
        $group: {
          _id: "$userId",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$amount" }
        }
      }
    ]);

    const repeatBuyers = customerOrders.filter(customer => customer.orderCount > 1).length;
    const newCustomers = Math.max(0, totalCustomers - repeatBuyers);
    const repeatRate = totalCustomers > 0 ? (repeatBuyers / totalCustomers) * 100 : 0;

    // Top customers
    const topCustomersData = await Promise.all(
      customerOrders
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 3)
        .map(async (customer) => {
          const user = await User.findById(customer._id);
          return {
            name: user?.name || 'Unknown Customer',
            totalSpent: customer.totalSpent,
            orders: customer.orderCount
          };
        })
    );

    // 1️⃣1️⃣ DEAL ANALYTICS - USING ACTUAL ORDER DATA
    const now = new Date();

    // Calculate deal performance from actual order data
    const dealPerformanceMap = new Map();

    // Process orders to find deal performance
    for (const order of allOrders) {
      for (const item of order.items) {
        if (item.isFromDeal && item.dealName) {
          // Find or create deal performance entry
          if (!dealPerformanceMap.has(item.dealName)) {
            // Find the deal by name
            const deal = allDeals.find(d => d.dealName === item.dealName);
            dealPerformanceMap.set(item.dealName, {
              deal: deal || { 
                dealName: item.dealName,
                dealType: 'flash_sale',
                dealDiscountType: 'percentage',
                dealDiscountValue: 0,
                status: 'published',
                dealStartDate: new Date(),
                dealEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                views: 0,
                clicks: 0
              },
              revenue: 0,
              cost: 0,
              sales: 0
            });
          }

          const performance = dealPerformanceMap.get(item.dealName);
          performance.revenue += (item.price || 0) * (item.quantity || 1);
          performance.sales += item.quantity || 1;
          
          // Calculate cost for this deal item
          if (item.cost) {
            performance.cost += item.cost * (item.quantity || 1);
          } else {
            performance.cost += (item.price || 0) * 0.6 * (item.quantity || 1);
          }
        }
      }
    }

    // Calculate active deals
    const activeDeals = allDeals.filter(deal => {
      if (deal.status !== "published") return false;
      const startDate = new Date(deal.dealStartDate);
      const endDate = new Date(deal.dealEndDate);
      return startDate <= now && endDate >= now;
    }).length;

    // Calculate average deal discount
    const dealsWithDiscount = allDeals.filter(deal => deal.dealDiscountValue && deal.dealDiscountValue > 0);
    const avgDealDiscount = dealsWithDiscount.length > 0 ? 
      dealsWithDiscount.reduce((sum, deal) => sum + deal.dealDiscountValue, 0) / dealsWithDiscount.length : 0;

    // Deal stats
    const dealStats = {
      totalDeals: allDeals.length,
      activeDeals,
      totalDealRevenue: parseFloat(totalDealRevenue.toFixed(2)),
      totalDealCost: parseFloat(totalDealCost.toFixed(2)),
      totalDealProfit: parseFloat(totalDealProfit.toFixed(2)),
      dealProfitMargin: parseFloat(dealProfitMargin.toFixed(2)),
      avgDealDiscount: parseFloat(avgDealDiscount.toFixed(2)),
      dealsSold: dealsSold,
      dealInventoryValue: parseFloat(dealInventoryValue.toFixed(2))
    };

    // Top deals - based on actual performance from orders
    const topDeals = Array.from(dealPerformanceMap.values())
      .filter(performance => performance.sales > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4)
      .map(performance => {
        const deal = performance.deal;
        const startDate = new Date(deal.dealStartDate);
        const endDate = new Date(deal.dealEndDate);
        const isActive = deal.status === "published" && startDate <= now && endDate >= now;
        
        return {
          _id: deal._id || deal.dealName,
          name: deal.dealName,
          type: deal.dealType,
          discountType: deal.dealDiscountType,
          discountValue: deal.dealDiscountValue,
          status: deal.status,
          isActive,
          views: deal.views || 0,
          clicks: deal.clicks || 0,
          revenue: performance.revenue,
          totalSales: performance.sales,
          profit: performance.revenue - performance.cost,
          startDate: deal.dealStartDate,
          endDate: deal.dealEndDate
        };
      });

    // If no deal performance data, show active deals
    if (topDeals.length === 0) {
      const activeDealsSorted = allDeals
        .filter(deal => {
          const startDate = new Date(deal.dealStartDate);
          const endDate = new Date(deal.dealEndDate);
          return deal.status === "published" && startDate <= now && endDate >= now;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4)
        .map(deal => {
          const startDate = new Date(deal.dealStartDate);
          const endDate = new Date(deal.dealEndDate);
          const isActive = deal.status === "published" && startDate <= now && endDate >= now;
          
          return {
            _id: deal._id,
            name: deal.dealName,
            type: deal.dealType,
            discountType: deal.dealDiscountType,
            discountValue: deal.dealDiscountValue,
            status: deal.status,
            isActive,
            views: deal.views || 0,
            clicks: deal.clicks || 0,
            revenue: 0,
            totalSales: 0,
            profit: 0,
            startDate: deal.dealStartDate,
            endDate: deal.dealEndDate
          };
        });
      
      topDeals.push(...activeDealsSorted);
    }

    // Deal performance by type
    const dealPerformance = Array.from(dealPerformanceMap.values())
      .filter(performance => performance.sales > 0)
      .reduce((acc, performance) => {
        const deal = performance.deal;
        const type = deal.dealType || 'flash_sale';
        
        const existing = acc.find(item => item.type === type);
        if (existing) {
          existing.count++;
          existing.totalViews += deal.views || 0;
          existing.totalClicks += deal.clicks || 0;
          existing.totalRevenue += performance.revenue;
          existing.totalSales += performance.sales;
          existing.totalProfit += (performance.revenue - performance.cost);
        } else {
          acc.push({
            type: type,
            count: 1,
            totalViews: deal.views || 0,
            totalClicks: deal.clicks || 0,
            totalRevenue: performance.revenue,
            totalSales: performance.sales,
            totalProfit: performance.revenue - performance.cost,
            avgDiscount: deal.dealDiscountValue || 0
          });
        }
        return acc;
      }, []);

    // 1️⃣2️⃣ ALERTS
    const alerts = [
      ...lowStockProducts.map(product => ({
        id: product._id.toString(),
        type: 'stock',
        title: product.quantity <= 2 ? 'Critical Stock Alert' : 'Low Stock Alert',
        message: `${product.name} is running ${product.quantity <= 2 ? 'very low' : 'low'} (${product.quantity} left)`,
        priority: product.quantity <= 2 ? 'high' : 'medium',
        timestamp: new Date().toISOString(),
        read: false
      })),
      ...allOrders
        .filter(order => order.amount > 2000)
        .slice(0, 2)
        .map(order => ({
          id: order._id.toString(),
          type: 'order',
          title: 'High Value Order',
          message: `Order #${order._id} - Rs ${order.amount.toLocaleString()}`,
          priority: 'medium',
          timestamp: new Date(order.date).toISOString(),
          read: false
        }))
    ];

    // ✅ FINAL RESPONSE
    res.status(200).json({
      stats: {
        totalOrders,
        totalProductRevenue: parseFloat(totalProductRevenue.toFixed(2)),
        totalProducts,
        pendingOrders,
        totalProductProfit: parseFloat(totalProductProfit.toFixed(2)),
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        totalProductCost: parseFloat(totalProductCost.toFixed(2)),
        totalItemsSold,
        inventoryValue: parseFloat(inventoryValue.toFixed(2)),
        ...dealStats
      },
      recentOrders: enhancedRecentOrders,
      topProducts,
      lowStockProducts,
      customerInsights: {
        totalCustomers,
        repeatBuyers,
        repeatRate: parseFloat(repeatRate.toFixed(1)),
        newCustomers,
        topCustomers: topCustomersData
      },
      dealData: {
        topDeals,
        dealPerformance,
        dealStats
      },
      alerts,
      timeRange
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ 
      message: "Error fetching dashboard data",
      error: error.message 
    });
  }
};

/**
 * SALES TREND CONTROLLER - NO HARDCODED VALUES
 */
export const getSalesTrend = async (req, res) => {
  try {
    const { period = "6months" } = req.query;

    let months = 6;
    if (period === '3months') months = 3;
    if (period === '12months') months = 12;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();

    // Get all orders and products for accurate cost calculation
    // 🔴 CRITICAL FIX: Exclude cancelled orders
    const allOrders = await Order.find({
      date: { $gte: startTimestamp, $lte: endTimestamp },
      status: { $nin: ['Cancelled', 'Payment Rejected'] },
      paymentStatus: { $ne: 'rejected' }
    });
    
    const allProducts = await Product.find({});

    const monthlyData = [];
    const currentDate = new Date(startDate);
    
    currentDate.setDate(1);
    
    while (currentDate <= endDate) {
      const monthKey = currentDate.toLocaleString('default', { month: 'short' });
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime();
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).getTime();

      const monthlyOrders = allOrders.filter(order => 
        order.date >= monthStart && order.date <= monthEnd
      );

      // Calculate ACTUAL revenue and cost (NO HARDCODING)
      let monthlyRevenue = 0;
      let monthlyCost = 0;

      for (const order of monthlyOrders) {
        monthlyRevenue += order.amount;
        
        // Calculate ACTUAL cost for this order
        for (const item of order.items) {
          if (item.cost) {
            // Use actual cost from order item
            monthlyCost += item.cost * (item.quantity || 1);
          } else if (item.productId) {
            // Find product and use its cost
            const product = allProducts.find(p => p._id.toString() === item.productId.toString());
            if (product) {
              monthlyCost += product.cost * (item.quantity || 1);
            } else if (item.price) {
              // Estimate cost if product not found
              monthlyCost += (item.price || 0) * 0.5 * (item.quantity || 1);
            }
          } else if (item.price) {
            // Estimate cost for items without productId
            monthlyCost += (item.price || 0) * 0.5 * (item.quantity || 1);
          } else {
            // Fallback estimation
            monthlyCost += order.amount * 0.5;
            break; // Avoid double counting for the same order
          }
        }
      }

      // Calculate ACTUAL profit (Revenue - Actual Cost) - NO HARDCODED 40%
      const monthlyProfit = monthlyRevenue - monthlyCost;

      monthlyData.push({
        period: monthKey,
        revenue: parseFloat(monthlyRevenue.toFixed(2)),
        profit: parseFloat(monthlyProfit.toFixed(2)),
        cost: parseFloat(monthlyCost.toFixed(2)),
        orders: monthlyOrders.length,
        profitMargin: monthlyRevenue > 0 ? parseFloat(((monthlyProfit / monthlyRevenue) * 100).toFixed(2)) : 0
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    res.json({ 
      trend: monthlyData,
      period
    });
  } catch (error) {
    console.error("Sales Trend Error:", error);
    res.status(500).json({ message: "Error fetching sales trend" });
  }
};

/**
 * PROFIT TREND CONTROLLER - USING ACTUAL DATA
 */
export const getProfitTrend = async (req, res) => {
  try {
    const { period = "6months" } = req.query;

    let months = 6;
    if (period === '3months') months = 3;
    if (period === '12months') months = 12;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();

    // Get all orders and products for accurate calculation
    // 🔴 CRITICAL FIX: Exclude cancelled orders
    const allOrders = await Order.find({
      date: { $gte: startTimestamp, $lte: endTimestamp },
      status: { $nin: ['Cancelled', 'Payment Rejected'] },
      paymentStatus: { $ne: 'rejected' }
    });
    const allProducts = await Product.find({});

    const monthlyData = [];
    const currentDate = new Date(startDate);
    
    currentDate.setDate(1);
    
    while (currentDate <= endDate) {
      const monthKey = currentDate.toLocaleString('default', { month: 'short' });
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime();
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).getTime();

      const monthlyOrders = allOrders.filter(order => 
        order.date >= monthStart && order.date <= monthEnd
      );

      // Calculate ACTUAL profit (NO HARDCODING)
      let monthlyProfit = 0;

      for (const order of monthlyOrders) {
        let orderRevenue = order.amount;
        let orderCost = 0;
        
        // Calculate ACTUAL cost for this order
        for (const item of order.items) {
          if (item.cost) {
            orderCost += item.cost * (item.quantity || 1);
          } else if (item.productId) {
            const product = allProducts.find(p => p._id.toString() === item.productId.toString());
            if (product) {
              orderCost += product.cost * (item.quantity || 1);
            } else if (item.price) {
              orderCost += (item.price || 0) * 0.5 * (item.quantity || 1);
            }
          } else if (item.price) {
            orderCost += (item.price || 0) * 0.5 * (item.quantity || 1);
          } else {
            orderCost += order.amount * 0.5;
            break;
          }
        }
        
        monthlyProfit += (orderRevenue - orderCost);
      }

      monthlyData.push({
        period: monthKey,
        profit: parseFloat(monthlyProfit.toFixed(2)),
        orders: monthlyOrders.length
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    res.json({ 
      trend: monthlyData,
      period
    });
  } catch (error) {
    console.error("Profit Trend Error:", error);
    res.status(500).json({ message: "Error fetching profit trend" });
  }
};

/**
 * PROFIT GROWTH CONTROLLER - SHOWS PROFIT GROWTH FOR ALL MONTHS
 */
export const getProfitGrowth = async (req, res) => {
  try {
    const { period = "12months" } = req.query;

    let months = 12;
    if (period === '6months') months = 6;
    if (period === '24months') months = 24;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();

    // Get all orders and products for accurate calculation
    // 🔴 CRITICAL FIX: Exclude cancelled orders
    const allOrders = await Order.find({
      date: { $gte: startTimestamp, $lte: endTimestamp },
      status: { $nin: ['Cancelled', 'Payment Rejected'] },
      paymentStatus: { $ne: 'rejected' }
    });
    const allProducts = await Product.find({});

    const monthlyData = [];
    const currentDate = new Date(startDate);
    
    currentDate.setDate(1);
    
    while (currentDate <= endDate) {
      const monthKey = currentDate.toLocaleString('default', { month: 'short' });
      const year = currentDate.getFullYear();
      const fullMonth = `${monthKey} ${year}`;
      
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime();
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).getTime();

      const monthlyOrders = allOrders.filter(order => 
        order.date >= monthStart && order.date <= monthEnd
      );

      // Calculate ACTUAL profit
      let monthlyProfit = 0;
      let monthlyRevenue = 0;
      let monthlyCost = 0;

      for (const order of monthlyOrders) {
        let orderRevenue = order.amount;
        let orderCost = 0;
        
        // Calculate ACTUAL cost for this order
        for (const item of order.items) {
          if (item.cost) {
            orderCost += item.cost * (item.quantity || 1);
          } else if (item.productId) {
            const product = allProducts.find(p => p._id.toString() === item.productId.toString());
            if (product) {
              orderCost += product.cost * (item.quantity || 1);
            } else if (item.price) {
              orderCost += (item.price || 0) * 0.5 * (item.quantity || 1);
            }
          } else if (item.price) {
            orderCost += (item.price || 0) * 0.5 * (item.quantity || 1);
          } else {
            orderCost += order.amount * 0.5;
            break;
          }
        }
        
        monthlyProfit += (orderRevenue - orderCost);
        monthlyRevenue += orderRevenue;
        monthlyCost += orderCost;
      }

      monthlyData.push({
        period: fullMonth,
        month: monthKey,
        year: year,
        profit: parseFloat(monthlyProfit.toFixed(2)),
        revenue: parseFloat(monthlyRevenue.toFixed(2)),
        cost: parseFloat(monthlyCost.toFixed(2)),
        orders: monthlyOrders.length,
        profitMargin: monthlyRevenue > 0 ? parseFloat(((monthlyProfit / monthlyRevenue) * 100).toFixed(2)) : 0
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Calculate profit growth (month-over-month)
    const monthlyDataWithGrowth = monthlyData.map((month, index) => {
      let profitGrowth = 0;
      let growthPercentage = 0;
      
      if (index > 0) {
        const previousMonth = monthlyData[index - 1];
        profitGrowth = month.profit - previousMonth.profit;
        growthPercentage = previousMonth.profit > 0 ? 
          ((profitGrowth / previousMonth.profit) * 100) : 100;
      }

      return {
        ...month,
        profitGrowth: parseFloat(profitGrowth.toFixed(2)),
        growthPercentage: parseFloat(growthPercentage.toFixed(2)),
        isPositiveGrowth: profitGrowth >= 0
      };
    });

    // Calculate overall statistics
    const totalProfit = monthlyData.reduce((sum, month) => sum + month.profit, 0);
    const averageMonthlyProfit = totalProfit / monthlyData.length;
    
    const profitableMonths = monthlyData.filter(month => month.profit > 0).length;
    const profitabilityRate = (profitableMonths / monthlyData.length) * 100;

    res.json({ 
      profitGrowth: monthlyDataWithGrowth,
      summary: {
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        averageMonthlyProfit: parseFloat(averageMonthlyProfit.toFixed(2)),
        totalMonths: monthlyData.length,
        profitableMonths,
        profitabilityRate: parseFloat(profitabilityRate.toFixed(2)),
        bestMonth: monthlyData.length > 0 ? 
          monthlyData.reduce((max, month) => month.profit > max.profit ? month : max) : null,
        worstMonth: monthlyData.length > 0 ? 
          monthlyData.reduce((min, month) => month.profit < min.profit ? month : min) : null
      },
      period
    });
  } catch (error) {
    console.error("Profit Growth Error:", error);
    res.status(500).json({ message: "Error fetching profit growth data" });
  }
};

/**
 * YEAR-OVER-YEAR PROFIT GROWTH COMPARISON
 */
export const getYearOverYearProfitGrowth = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    const yearlyData = [];

    // Process both years
    for (let year of [previousYear, currentYear]) {
      const yearStart = new Date(year, 0, 1).getTime();
      const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime();

      // 🔴 CRITICAL FIX: Exclude cancelled orders
      const yearlyOrders = await Order.find({
        date: { $gte: yearStart, $lte: yearEnd },
        status: { $nin: ['Cancelled', 'Payment Rejected'] },
        paymentStatus: { $ne: 'rejected' }
      });
      const allProducts = await Product.find({});

      const monthlyProfits = [];
      
      // Calculate profit for each month
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(year, month, 1).getTime();
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59).getTime();

        const monthlyOrders = yearlyOrders.filter(order => 
          order.date >= monthStart && order.date <= monthEnd
        );

        let monthlyProfit = 0;
        for (const order of monthlyOrders) {
          let orderRevenue = order.amount;
          let orderCost = 0;
          
          for (const item of order.items) {
            if (item.cost) {
              orderCost += item.cost * (item.quantity || 1);
            } else if (item.productId) {
              const product = allProducts.find(p => p._id.toString() === item.productId.toString());
              if (product) {
                orderCost += product.cost * (item.quantity || 1);
              } else if (item.price) {
                orderCost += (item.price || 0) * 0.5 * (item.quantity || 1);
              }
            } else if (item.price) {
              orderCost += (item.price || 0) * 0.5 * (item.quantity || 1);
            } else {
              orderCost += order.amount * 0.5;
              break;
            }
          }
          
          monthlyProfit += (orderRevenue - orderCost);
        }

        monthlyProfits.push({
          month: new Date(year, month).toLocaleString('default', { month: 'short' }),
          profit: parseFloat(monthlyProfit.toFixed(2)),
          orders: monthlyOrders.length
        });
      }

      const yearlyProfit = monthlyProfits.reduce((sum, month) => sum + month.profit, 0);
      
      yearlyData.push({
        year,
        monthlyProfits,
        totalProfit: parseFloat(yearlyProfit.toFixed(2)),
        averageMonthlyProfit: parseFloat((yearlyProfit / 12).toFixed(2))
      });
    }

    // Calculate growth rates
    const currentYearData = yearlyData.find(y => y.year === currentYear);
    const previousYearData = yearlyData.find(y => y.year === previousYear);

    const totalProfitGrowth = currentYearData.totalProfit - previousYearData.totalProfit;
    const totalProfitGrowthPercentage = (totalProfitGrowth / previousYearData.totalProfit) * 100;

    const monthlyGrowth = currentYearData.monthlyProfits.map((currentMonth, index) => {
      const previousMonth = previousYearData.monthlyProfits[index];
      const profitGrowth = currentMonth.profit - previousMonth.profit;
      const growthPercentage = previousMonth.profit > 0 ? 
        (profitGrowth / previousMonth.profit) * 100 : 100;

      return {
        month: currentMonth.month,
        currentYearProfit: currentMonth.profit,
        previousYearProfit: previousMonth.profit,
        profitGrowth: parseFloat(profitGrowth.toFixed(2)),
        growthPercentage: parseFloat(growthPercentage.toFixed(2))
      };
    });

    res.json({
      comparison: monthlyGrowth,
      summary: {
        currentYear: currentYearData,
        previousYear: previousYearData,
        totalProfitGrowth: parseFloat(totalProfitGrowth.toFixed(2)),
        totalProfitGrowthPercentage: parseFloat(totalProfitGrowthPercentage.toFixed(2)),
        averageMonthlyGrowth: parseFloat((monthlyGrowth.reduce((sum, month) => sum + month.growthPercentage, 0) / 12).toFixed(2))
      }
    });
  } catch (error) {
    console.error("Year-over-Year Profit Growth Error:", error);
    res.status(500).json({ message: "Error fetching year-over-year profit growth" });
  }
};

/**
 * SIMPLE PROFIT GROWTH BY MONTH
 */
export const getMonthlyProfitGrowth = async (req, res) => {
  try {
    // 🔴 CRITICAL FIX: Exclude cancelled orders
    const allOrders = await Order.find({ 
      status: { $nin: ['Cancelled', 'Payment Rejected'] },
      paymentStatus: { $ne: 'rejected' }
    }).sort({ date: 1 });
    
    const allProducts = await Product.find({});

    // Group orders by month
    const ordersByMonth = {};
    
    allOrders.forEach(order => {
      const orderDate = new Date(order.date);
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = orderDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      if (!ordersByMonth[monthKey]) {
        ordersByMonth[monthKey] = {
          period: monthName,
          orders: [],
          profit: 0,
          revenue: 0,
          cost: 0
        };
      }
      ordersByMonth[monthKey].orders.push(order);
    });

    // Calculate profit for each month
    const monthlyProfits = await Promise.all(
      Object.entries(ordersByMonth).map(async ([monthKey, monthData]) => {
        let monthlyProfit = 0;
        let monthlyRevenue = 0;
        let monthlyCost = 0;

        for (const order of monthData.orders) {
          monthlyRevenue += order.amount;
          
          for (const item of order.items) {
            if (item.cost) {
              monthlyCost += item.cost * (item.quantity || 1);
            } else if (item.productId) {
              const product = allProducts.find(p => p._id.toString() === item.productId.toString());
              if (product) {
                monthlyCost += product.cost * (item.quantity || 1);
              } else if (item.price) {
                monthlyCost += (item.price || 0) * 0.5 * (item.quantity || 1);
              }
            } else if (item.price) {
              monthlyCost += (item.price || 0) * 0.5 * (item.quantity || 1);
            } else {
              monthlyCost += order.amount * 0.5;
              break;
            }
          }
        }

        monthlyProfit = monthlyRevenue - monthlyCost;

        return {
          period: monthData.period,
          monthKey,
          profit: parseFloat(monthlyProfit.toFixed(2)),
          revenue: parseFloat(monthlyRevenue.toFixed(2)),
          cost: parseFloat(monthlyCost.toFixed(2)),
          orders: monthData.orders.length,
          profitMargin: monthlyRevenue > 0 ? parseFloat(((monthlyProfit / monthlyRevenue) * 100).toFixed(2)) : 0
        };
      })
    );

    // Sort by date and calculate growth
    monthlyProfits.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    
    const monthlyGrowth = monthlyProfits.map((month, index) => {
      let profitGrowth = 0;
      let growthPercentage = 0;
      
      if (index > 0) {
        const previousMonth = monthlyProfits[index - 1];
        profitGrowth = month.profit - previousMonth.profit;
        growthPercentage = previousMonth.profit > 0 ? 
          ((profitGrowth / previousMonth.profit) * 100) : 100;
      }

      return {
        ...month,
        profitGrowth: parseFloat(profitGrowth.toFixed(2)),
        growthPercentage: parseFloat(growthPercentage.toFixed(2)),
        isPositiveGrowth: profitGrowth >= 0
      };
    });

    res.json({
      monthlyProfitGrowth: monthlyGrowth,
      totalMonths: monthlyGrowth.length,
      overallGrowth: monthlyGrowth.length > 1 ? 
        monthlyGrowth[monthlyGrowth.length - 1].profit - monthlyGrowth[0].profit : 0
    });
  } catch (error) {
    console.error("Monthly Profit Growth Error:", error);
    res.status(500).json({ message: "Error fetching monthly profit growth" });
  }
};

/**
 * ALERTS CONTROLLER - IMPROVED
 */
export const getAlerts = async (req, res) => {
  try {
    const lowStockProducts = await Product.find({ 
      quantity: { $lt: 10, $gt: 0 }
    }).select("name quantity category cost");

    const outOfStockProducts = await Product.find({ 
      quantity: 0
    }).select("name category");

    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    // 🔴 CRITICAL FIX: Exclude cancelled orders from high value alerts
    const highValueOrders = await Order.find({
      amount: { $gt: 2000 },
      date: { $gte: oneWeekAgo },
      status: { $nin: ['Cancelled', 'Payment Rejected'] },
      paymentStatus: { $ne: 'rejected' }
    }).select("_id amount date");

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const expiringDeals = await Deal.find({
      status: "published",
      dealEndDate: { 
        $lte: sevenDaysFromNow,
        $gte: new Date() 
      }
    }).select("dealName dealEndDate");

    const alerts = [
      ...lowStockProducts.map(product => ({
        id: product._id.toString(),
        type: 'stock',
        title: product.quantity <= 2 ? 'Critical Stock Alert' : 'Low Stock Alert',
        message: `${product.name} is running ${product.quantity <= 2 ? 'very low' : 'low'} (${product.quantity} left)`,
        priority: product.quantity <= 2 ? 'high' : 'medium',
        timestamp: new Date().toISOString(),
        read: false
      })),
      ...outOfStockProducts.map(product => ({
        id: product._id.toString(),
        type: 'stock',
        title: 'Out of Stock',
        message: `${product.name} is out of stock`,
        priority: 'high',
        timestamp: new Date().toISOString(),
        read: false
      })),
      ...highValueOrders.map(order => ({
        id: order._id.toString(),
        type: 'order',
        title: 'High Value Order',
        message: `Order #${order._id} - Rs ${order.amount.toLocaleString()}`,
        priority: 'medium',
        timestamp: new Date(order.date).toISOString(),
        read: false
      })),
      ...expiringDeals.map(deal => ({
        id: deal._id.toString(),
        type: 'deal',
        title: 'Deal Expiring Soon',
        message: `${deal.dealName} expires on ${deal.dealEndDate.toLocaleDateString()}`,
        priority: 'medium',
        timestamp: new Date().toISOString(),
        read: false
      }))
    ];

    res.json({ alerts });
  } catch (error) {
    console.error("Alerts Error:", error);
    res.status(500).json({ message: "Error fetching alerts" });
  }
};

/**
 * CUSTOMER ANALYTICS CONTROLLER
 */
export const getCustomerAnalytics = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const dateRange = getDateRange(period);
    const startTimestamp = dateRange.start.getTime();
    const endTimestamp = dateRange.end.getTime();

    const totalCustomers = await User.countDocuments();

    // 🔴 CRITICAL FIX: Exclude cancelled orders from customer analytics
    const customerOrders = await Order.find({
      date: { $gte: startTimestamp, $lte: endTimestamp },
      status: { $nin: ['Cancelled', 'Payment Rejected'] },
      paymentStatus: { $ne: 'rejected' }
    });

    const uniqueCustomers = [...new Set(customerOrders.map(order => order.userId))];
    const repeatCustomers = uniqueCustomers.filter(customerId => {
      const customerOrderCount = customerOrders.filter(order => order.userId === customerId).length;
      return customerOrderCount > 1;
    }).length;

    res.json({
      totalCustomers,
      activeCustomers: uniqueCustomers.length,
      repeatCustomers,
      newCustomers: Math.max(0, uniqueCustomers.length - repeatCustomers),
      repeatRate: uniqueCustomers.length > 0 ? (repeatCustomers / uniqueCustomers.length) * 100 : 0,
      period
    });
  } catch (error) {
    console.error("Customer Analytics Error:", error);
    res.status(500).json({ message: "Error fetching customer analytics" });
  }
};

// Helper function
function getDateRange(timeRange) {
  const now = new Date();
  const start = new Date();

  switch (timeRange) {
    case 'daily':
      start.setDate(now.getDate() - 1);
      break;
    case 'weekly':
      start.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      start.setMonth(now.getMonth() - 1);
      break;
    default:
      start.setFullYear(now.getFullYear() - 1);
  }

  return { start, end: now };
}