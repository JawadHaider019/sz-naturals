import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDollarSign, faChartLine, faClipboardList, faClock, faPlus, 
  faBoxes, faShoppingCart, faWarehouse, faChartPie, faTags,
  faArrowTrendUp, faArrowTrendDown, faUsers, faRocket, faPercent,
  faBell, faSync, faExclamationTriangle, faTimes, faFire,
  faUserCheck, faUserPlus, faMapMarkerAlt, faExclamationCircle,
  faComments, faStar, faReply, faChartBar, faCalendarAlt,
  faMoneyBillTrendUp, faChartSimple, faCalendarWeek
} from '@fortawesome/free-solid-svg-icons';
import { backendUrl } from "../App";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Title, Tooltip, Legend, Filler
);

// Constants

const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api`;
const TIME_RANGES = ['daily', 'weekly', 'monthly'];
const CHART_TYPES = ['pie', 'bar'];
const PROFIT_PERIODS = ['3months', '6months', '12months', '24months'];
const PROFIT_GROWTH_TYPES = ['monthly', 'yoy', 'detailed'];

// Reusable Components
const StatCard = React.memo(({ title, value, icon, color, change, subtitle, trend }) => (
  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-gray-600 text-sm font-medium mb-2">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900">
          {typeof value === 'number' && value >= 1000 ? `Rs ${value.toLocaleString()}` : value}
        </p>
        {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-1">{subtitle}</p>}
        {change && (
          <div className="flex items-center mt-2">
            <FontAwesomeIcon 
              icon={change > 0 ? faArrowTrendUp : faArrowTrendDown} 
              className={`text-xs mr-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`} 
            />
            <p className={`text-xs sm:text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}%
            </p>
          </div>
        )}
        {trend && <div className="flex items-center mt-1"><span className="text-xs text-gray-500">{trend}</span></div>}
      </div>
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${color} shadow-md`}>
        <FontAwesomeIcon icon={icon} className="text-lg sm:text-xl text-white" />
      </div>
    </div>
  </div>
));

const StatusBadge = React.memo(({ status }) => {
  const colors = { 
    Delivered: 'bg-green-100 text-green-800', 
    Processing: 'bg-blue-100 text-blue-800', 
    Shipped: 'bg-yellow-100 text-yellow-800',
    'Order Placed': 'bg-purple-100 text-purple-800',
    Packing: 'bg-orange-100 text-orange-800'
  };
  return (
    <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
});

const StockBadge = React.memo(({ stock }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
    stock <= 2 ? 'bg-red-100 text-red-800' : 
    stock <= 5 ? 'bg-yellow-100 text-yellow-800' : 
    'bg-green-100 text-green-800'
  }`}>
    {stock} left
  </span>
));

const ChartToggle = React.memo(({ chartKey, currentView, onToggle, options = CHART_TYPES }) => (
  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
    {options.map(type => (
      <button
        key={type}
        onClick={() => onToggle(type)}
        className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs font-medium transition-colors ${
          currentView === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
        }`}
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </button>
    ))}
  </div>
));

const TimeRangeSelector = ({ currentRange, onRangeChange, options }) => (
  <div className="flex gap-1 sm:gap-2 flex-wrap">
    {options.map(range => (
      <button 
        key={range} 
        onClick={() => onRangeChange(range)} 
        className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium ${
          currentRange === range ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}
      >
        {range.charAt(0).toUpperCase() + range.slice(1)}
      </button>
    ))}
  </div>
);

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading dashboard data...</p>
    </div>
  </div>
);

const EmptyState = ({ icon, message }) => (
  <div className="flex items-center justify-center h-full text-gray-500">
    <div className="text-center">
      <FontAwesomeIcon icon={icon} className="text-4xl text-gray-300 mb-2" />
      <p>{message}</p>
    </div>
  </div>
);

// Custom Hook for API calls
const useApi = () => {
  const fetchData = useCallback(async (url, options = {}) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }, []);

  return { fetchData };
};

const Dashboard = () => {
  // State management
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentOrders: [],
    topProducts: [],
    lowStockProducts: [],
    customerInsights: {},
    dealData: { topDeals: [], dealPerformance: [], dealStats: {} },
    alerts: []
  });
  const [commentNotifications, setCommentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('monthly');
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [chartViews, setChartViews] = useState({
    revenue: 'pie',
    customers: 'pie',
    products: 'pie',
    deals: 'pie',
    profitGrowth: 'bar'
  });
  const [profitTimeRange, setProfitTimeRange] = useState('6months');
  const [profitGrowthType, setProfitGrowthType] = useState('monthly');
  const [profitTrend, setProfitTrend] = useState([]);
  const [profitGrowth, setProfitGrowth] = useState([]);
  const [yearOverYearProfit, setYearOverYearProfit] = useState([]);
  const [profitGrowthSummary, setProfitGrowthSummary] = useState({});

  const { fetchData } = useApi();

  // Memoized data calculations
  const combinedMetrics = useMemo(() => {
    const { stats } = dashboardData;
    const productRevenue = stats.totalProductRevenue || 0;
    const dealRevenue = stats.totalDealRevenue || 0;
    const totalRevenue = productRevenue + dealRevenue;
    
    const productCost = stats.totalProductCost || 0;
    const dealCost = stats.totalDealCost || 0;
    const totalCost = productCost + dealCost;
    
    const productProfit = stats.totalProductProfit || 0;
    const dealProfit = stats.totalDealProfit || 0;
    const totalProfit = productProfit + dealProfit;

    return {
      productRevenue,
      productCost,
      productProfit,
      dealRevenue,
      dealCost,
      dealProfit,
      totalRevenue,
      totalCost,
      totalProfit,
      totalProductSold: stats.totalItemsSold - (stats.dealsSold || 0),
      totalInventoryValue: (stats.inventoryValue || 0) + (stats.dealInventoryValue || 0)
    };
  }, [dashboardData.stats]);

  const totalNotificationsCount = useMemo(() => {
    const unreadAlertsCount = dashboardData.alerts.filter(alert => !alert.read).length;
    const unreadCommentsCount = commentNotifications.length;
    return unreadAlertsCount + unreadCommentsCount;
  }, [dashboardData.alerts, commentNotifications]);

  // API calls
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchData(`${API_BASE}/dashboard/stats?timeRange=${timeRange}`);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, fetchData]);

  const fetchCommentNotifications = useCallback(async () => {
    try {
      const data = await fetchData(`${API_BASE}/comments/notifications`);
      setCommentNotifications(data);
    } catch (error) {
      console.error('Error fetching comment notifications:', error);
    }
  }, [fetchData]);

  // Fetch profit trend data
  const fetchProfitTrend = useCallback(async () => {
    try {
      const data = await fetchData(`${API_BASE}/dashboard/profit-trend?period=${profitTimeRange}`);
      if (data.trend && data.trend.length > 0) {
        setProfitTrend(data.trend);
      } else {
        setProfitTrend([]);
      }
    } catch (error) {
      console.error('Error fetching profit trend:', error);
      setProfitTrend([]);
    }
  }, [profitTimeRange, fetchData]);

  // Fetch detailed profit growth data
  const fetchProfitGrowth = useCallback(async () => {
    try {
      const data = await fetchData(`${API_BASE}/dashboard/profit-growth?period=${profitTimeRange}`);
      if (data.profitGrowth && data.profitGrowth.length > 0) {
        setProfitGrowth(data.profitGrowth);
        setProfitGrowthSummary(data.summary || {});
      } else {
        setProfitGrowth([]);
        setProfitGrowthSummary({});
      }
    } catch (error) {
      console.error('Error fetching profit growth:', error);
      setProfitGrowth([]);
      setProfitGrowthSummary({});
    }
  }, [profitTimeRange, fetchData]);

  // Fetch year-over-year profit growth
  const fetchYearOverYearProfit = useCallback(async () => {
    try {
      const data = await fetchData(`${API_BASE}/dashboard/profit-growth/yoy`);
      if (data.comparison && data.comparison.length > 0) {
        setYearOverYearProfit(data);
      } else {
        setYearOverYearProfit({ comparison: [], summary: {} });
      }
    } catch (error) {
      console.error('Error fetching year-over-year profit growth:', error);
      setYearOverYearProfit({ comparison: [], summary: {} });
    }
  }, [fetchData]);

  // Event handlers
  const handleCommentRead = useCallback(async (commentId) => {
    try {
      await fetchData(`${API_BASE}/comments/${commentId}/read`, { method: 'PATCH' });
      fetchCommentNotifications();
    } catch (error) {
      console.error('Error marking comment as read:', error);
    }
  }, [fetchData, fetchCommentNotifications]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(), 
      fetchProfitTrend(),
      fetchProfitGrowth(),
      fetchYearOverYearProfit(),
      fetchCommentNotifications()
    ]);
    setRefreshing(false);
  }, [fetchDashboardData, fetchProfitTrend, fetchProfitGrowth, fetchYearOverYearProfit, fetchCommentNotifications]);

  const handleChartToggle = useCallback((chartKey, viewType) => {
    setChartViews(prev => ({
      ...prev,
      [chartKey]: viewType
    }));
  }, []);

  const handleTimeRangeChange = useCallback((range) => {
    setTimeRange(range);
  }, []);

  const handleProfitGrowthTypeChange = useCallback((type) => {
    setProfitGrowthType(type);
  }, []);

  // Effects
  useEffect(() => {
    fetchDashboardData();
    fetchCommentNotifications();
  }, [fetchDashboardData, fetchCommentNotifications]);

  useEffect(() => {
    fetchProfitTrend();
    fetchProfitGrowth();
    fetchYearOverYearProfit();
  }, [fetchProfitTrend, fetchProfitGrowth, fetchYearOverYearProfit]);

  // Chart data preparation using actual backend data
  const chartConfigs = useMemo(() => {
    const { customerInsights, topProducts, dealData } = dashboardData;

    const getDealNames = () => {
      if (dealData.topDeals?.length > 0) {
        return dealData.topDeals.map(deal => deal.dealName || deal.name || `Deal ${deal._id}`);
      }
      return ['No Deal Data'];
    };

    const getDealSalesData = () => {
      if (dealData.topDeals?.length > 0) {
        return dealData.topDeals.map(deal => deal.totalSales || 0);
      }
      return [0];
    };

    const getProductNames = () => {
      if (topProducts?.length > 0) {
        return topProducts.map(product => product.name || `Product ${product._id}`);
      }
      return ['No Product Data'];
    };

    const getProductSalesData = () => {
      if (topProducts?.length > 0) {
        return topProducts.map(product => product.totalSales || 0);
      }
      return [0];
    };

    // Profit Growth Chart Configurations
    const profitGrowthData = {
      monthly: {
        data: {
          labels: profitTrend.map(item => item.period),
          datasets: [{
            label: 'Profit (Rs)',
            data: profitTrend.map(item => item.profit),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: { 
              display: true, 
              text: `Monthly Profit Trend (${profitTimeRange === '3months' ? '3 Months' : profitTimeRange === '6months' ? '6 Months' : profitTimeRange === '12months' ? '12 Months' : '24 Months'})`
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return 'Rs ' + value.toLocaleString();
                }
              }
            }
          }
        }
      },
      detailed: {
        data: {
          labels: profitGrowth.map(item => item.period),
          datasets: [
            {
              label: 'Profit (Rs)',
              data: profitGrowth.map(item => item.profit),
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              borderColor: 'rgb(16, 185, 129)',
              borderWidth: 2,
              type: 'bar'
            },
            {
              label: 'Growth %',
              data: profitGrowth.map(item => item.growthPercentage),
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 2,
              type: 'line',
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: { display: true },
            title: { 
              display: true, 
              text: `Profit Growth Analysis (${profitTimeRange})`
            }
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Profit (Rs)'
              },
              ticks: {
                callback: function(value) {
                  return 'Rs ' + value.toLocaleString();
                }
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Growth %'
              },
              grid: {
                drawOnChartArea: false,
              },
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          }
        }
      },
      yoy: {
        data: {
          labels: yearOverYearProfit.comparison?.map(item => item.month) || [],
          datasets: [
            {
              label: 'Current Year Profit',
              data: yearOverYearProfit.comparison?.map(item => item.currentYearProfit) || [],
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              borderColor: 'rgb(16, 185, 129)',
              borderWidth: 2,
            },
            {
              label: 'Previous Year Profit',
              data: yearOverYearProfit.comparison?.map(item => item.previousYearProfit) || [],
              backgroundColor: 'rgba(156, 163, 175, 0.8)',
              borderColor: 'rgb(156, 163, 175)',
              borderWidth: 2,
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true },
            title: { 
              display: true, 
              text: 'Year-over-Year Profit Comparison'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return 'Rs ' + value.toLocaleString();
                }
              }
            }
          }
        }
      }
    };

    return {
      revenue: {
        pie: {
          data: {
            labels: ['Product Revenue', 'Deal Revenue', 'Total Profit'],
            datasets: [{
              data: [combinedMetrics.productRevenue, combinedMetrics.dealRevenue, combinedMetrics.totalProfit],
              backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(16, 185, 129, 0.8)'],
              borderColor: ['rgb(59, 130, 246)', 'rgb(139, 92, 246)', 'rgb(16, 185, 129)'],
              borderWidth: 2,
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
              title: { display: true, text: 'Revenue & Profit Breakdown' }
            }
          }
        },
        bar: {
          data: {
            labels: ['Product Revenue', 'Deal Revenue', 'Total Cost', 'Total Profit'],
            datasets: [{
              label: 'Amount (Rs)',
              data: [combinedMetrics.productRevenue, combinedMetrics.dealRevenue, combinedMetrics.totalCost, combinedMetrics.totalProfit],
              backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(16, 185, 129, 0.8)'],
              borderColor: ['rgb(59, 130, 246)', 'rgb(139, 92, 246)', 'rgb(239, 68, 68)', 'rgb(16, 185, 129)'],
              borderWidth: 1,
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'Revenue & Cost Analysis' }
            }
          }
        }
      },
      customers: {
        pie: {
          data: {
            labels: ['New Customers', 'Returning Customers'],
            datasets: [{
              data: [customerInsights.newCustomers || 0, customerInsights.repeatBuyers || 0],
              backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)'],
              borderColor: ['rgb(59, 130, 246)', 'rgb(16, 185, 129)'],
              borderWidth: 2,
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
              title: { display: true, text: 'Customer Distribution' }
            }
          }
        },
        bar: {
          data: {
            labels: ['New Customers', 'Returning Customers'],
            datasets: [{
              label: 'Count',
              data: [customerInsights.newCustomers || 0, customerInsights.repeatBuyers || 0],
              backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)'],
              borderColor: ['rgb(59, 130, 246)', 'rgb(16, 185, 129)'],
              borderWidth: 1,
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'Customer Distribution' }
            }
          }
        }
      },
      products: {
        pie: {
          data: {
            labels: getProductNames(),
            datasets: [{
              data: getProductSalesData(),
              backgroundColor: [
                'rgba(59, 130, 246, 0.8)', 
                'rgba(16, 185, 129, 0.8)', 
                'rgba(139, 92, 246, 0.8)', 
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(156, 163, 175, 0.8)'
              ],
              borderWidth: 2,
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
              title: { display: true, text: 'Top Selling Products' }
            }
          }
        },
        bar: {
          data: {
            labels: getProductNames(),
            datasets: [{
              label: 'Units Sold',
              data: getProductSalesData(),
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1,
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'Top Selling Products' }
            }
          }
        }
      },
      deals: {
        pie: {
          data: {
            labels: getDealNames(),
            datasets: [{
              data: getDealSalesData(),
              backgroundColor: [
                'rgba(139, 92, 246, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)'
              ],
              borderWidth: 2,
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
              title: { display: true, text: 'Top Performing Deals' }
            }
          }
        },
        bar: {
          data: {
            labels: getDealNames(),
            datasets: [{
              label: 'Units Sold',
              data: getDealSalesData(),
              backgroundColor: 'rgba(139, 92, 246, 0.8)',
              borderColor: 'rgb(139, 92, 246)',
              borderWidth: 1,
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'Top Performing Deals' }
            }
          }
        }
      },
      profitGrowth: profitGrowthData[profitGrowthType] || profitGrowthData.monthly
    };
  }, [dashboardData, combinedMetrics, profitTrend, profitGrowth, yearOverYearProfit, profitTimeRange, profitGrowthType]);

  // Quick actions configuration
  const quickActions = useMemo(() => [
    { to: "/add", icon: faPlus, text: "Add Product", color: "bg-blue-500" },
    { to: "/list", icon: faBoxes, text: "Manage Products", color: "bg-green-500" },
    { to: "/orders", icon: faShoppingCart, text: "View Orders", color: "bg-red-500" },
    { to: "/content-management", icon: faRocket, text: "Content Management", color: "bg-purple-500" },
  ], []);

  // Profit Growth Summary Cards
  const ProfitSummaryCards = useMemo(() => {
    if (!profitGrowthSummary || Object.keys(profitGrowthSummary).length === 0) {
      return null;
    }

    const {
      totalProfit = 0,
      averageMonthlyProfit = 0,
      totalMonths = 0,
      profitableMonths = 0,
      profitabilityRate = 0,
      bestMonth = null,
      worstMonth = null
    } = profitGrowthSummary;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Profit Period" 
          value={`Rs ${totalProfit.toLocaleString()}`}
          icon={faMoneyBillTrendUp}
          color="bg-green-500"
          subtitle={`${totalMonths} months analyzed`}
        />
        <StatCard 
          title="Avg Monthly Profit" 
          value={`Rs ${averageMonthlyProfit.toLocaleString()}`}
          icon={faChartSimple}
          color="bg-blue-500"
          subtitle={`${profitabilityRate.toFixed(1)}% profitable months`}
        />
        <StatCard 
          title="Profitable Months" 
          value={profitableMonths}
          icon={faCalendarWeek}
          color="bg-emerald-500"
          subtitle={`${totalMonths} total months`}
          trend={`${profitabilityRate.toFixed(1)}% success rate`}
        />
        <StatCard 
          title="Best Month" 
          value={bestMonth ? `Rs ${bestMonth.profit.toLocaleString()}` : 'N/A'}
          icon={faChartLine}
          color="bg-purple-500"
          subtitle={bestMonth ? bestMonth.period : 'No data'}
        />
      </div>
    );
  }, [profitGrowthSummary]);

  // Alerts Modal Component
  const AlertsModal = useCallback(() => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white sticky top-0">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faBell} className="text-yellow-500 text-xl" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Notifications</h3>
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {totalNotificationsCount} new
            </span>
          </div>
          <button onClick={() => setShowAlertsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <FontAwesomeIcon icon={faTimes} className="text-lg" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[70vh]">
          {/* Comment Notifications Section */}
          {commentNotifications.length > 0 && (
            <div className="border-b border-gray-200">
              <div className="p-4 bg-blue-50">
                <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                  <FontAwesomeIcon icon={faComments} />
                  New Reviews & Comments ({commentNotifications.length})
                </h4>
              </div>
              <div className="divide-y divide-gray-200">
                {commentNotifications.map(comment => (
                  <div 
                    key={comment._id} 
                    className="p-4 sm:p-6 bg-blue-50 transition-colors cursor-pointer hover:bg-blue-100"
                    onClick={() => handleCommentRead(comment._id)}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faComments} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-blue-900">
                            New {comment.rating ? 'Review' : 'Comment'}
                          </h4>
                          <div className="flex items-center gap-2">
                            {comment.rating && (
                              <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded">
                                <FontAwesomeIcon icon={faStar} className="text-yellow-500 text-xs" />
                                <span className="text-xs font-medium text-yellow-800">{comment.rating}</span>
                              </div>
                            )}
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">New</span>
                          </div>
                        </div>
                        <p className="text-sm text-blue-800 mb-1">
                          <strong>{comment.author}</strong> on <strong>{comment.productId?.name || 'Product'}</strong>
                        </p>
                        <p className="text-sm text-blue-700 mb-2 line-clamp-2">{comment.content}</p>
                        <p className="text-xs text-blue-600">
                          {new Date(comment.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Alerts Section */}
          {dashboardData.alerts.length > 0 && (
            <div>
              <div className="p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  System Alerts ({dashboardData.alerts.filter(alert => !alert.read).length})
                </h4>
              </div>
              <div className="divide-y divide-gray-200">
                {dashboardData.alerts.map(alert => (
                  <div key={alert.id} className={`p-4 sm:p-6 transition-colors ${!alert.read ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                        alert.priority === 'high' ? 'bg-red-100' : 'bg-yellow-100'
                      }`}>
                        <FontAwesomeIcon 
                          icon={faExclamationTriangle} 
                          className={alert.priority === 'high' ? 'text-red-600' : 'text-yellow-600'} 
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-semibold ${!alert.read ? 'text-yellow-900' : 'text-gray-900'}`}>
                            {alert.title}
                          </h4>
                          {!alert.read && <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">New</span>}
                        </div>
                        <p className={`text-sm mb-2 ${!alert.read ? 'text-yellow-800' : 'text-gray-600'}`}>
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {commentNotifications.length === 0 && dashboardData.alerts.length === 0 && (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faBell} className="text-gray-300 text-4xl mb-4" />
              <p className="text-gray-500">No new notifications</p>
            </div>
          )}
        </div>
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button 
            onClick={() => setShowAlertsModal(false)} 
            className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Close Notifications
          </button>
        </div>
      </div>
    </div>
  ), [commentNotifications, dashboardData.alerts, totalNotificationsCount, handleCommentRead]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const { stats, recentOrders, topProducts, lowStockProducts, dealData, customerInsights } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Welcome back! Here's what's happening with your store today.</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <FontAwesomeIcon 
                icon={faSync} 
                className={`text-xl ${refreshing ? 'animate-spin' : ''}`} 
              />
            </button>
          
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard 
            title="Total Revenue" 
            value={`Rs ${combinedMetrics.totalRevenue?.toLocaleString()}`} 
            subtitle={`Products: Rs ${combinedMetrics.productRevenue?.toLocaleString()} | Deals: Rs ${combinedMetrics.dealRevenue?.toLocaleString()}`}
            icon={faDollarSign} 
            color="bg-green-500" 
          />
          <StatCard 
            title="Total Cost" 
            value={`Rs ${combinedMetrics.totalCost?.toLocaleString()}`} 
            subtitle={`Products: Rs ${combinedMetrics.productCost?.toLocaleString()} | Deals: Rs ${combinedMetrics.dealCost?.toLocaleString()}`}
            icon={faChartLine} 
            color="bg-red-500" 
          />
          <StatCard 
            title="Total Profit" 
            value={`Rs ${combinedMetrics.totalProfit?.toLocaleString()}`} 
            subtitle={`Products: Rs ${combinedMetrics.productProfit?.toLocaleString()} | Deals: Rs ${combinedMetrics.dealProfit?.toLocaleString()}`}
            icon={faChartPie} 
            color="bg-blue-500" 
          />
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard 
            title="Active Deals" 
            value={stats.activeDeals} 
            icon={faRocket} 
            color="bg-purple-500" 
          />
          <StatCard 
            title="Deals Sold" 
            value={stats.dealsSold} 
            icon={faFire} 
            color="bg-orange-500" 
          />
          <StatCard 
            title="Total Products" 
            value={stats.totalProducts} 
            icon={faBoxes} 
            color="bg-indigo-500" 
          />
          <StatCard 
            title="Products Sold" 
            value={combinedMetrics.totalProductSold} 
            icon={faShoppingCart} 
            color="bg-blue-500" 
          />
        </div>

        {/* Tertiary Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard 
            title="Inventory Value" 
            value={`Rs ${combinedMetrics.totalInventoryValue?.toLocaleString()}`} 
            subtitle={`Products: Rs ${stats.inventoryValue?.toLocaleString()} | Deals: Rs ${stats.dealInventoryValue?.toLocaleString()}`}
            icon={faWarehouse} 
            color="bg-green-500" 
          />
          <StatCard 
            title="Total Orders" 
            value={stats.totalOrders} 
            subtitle={`Pending: ${stats.pendingOrders}`}
            icon={faClipboardList} 
            color="bg-yellow-500" 
          />
          <StatCard 
            title="Pending Orders" 
            value={stats.pendingOrders} 
            icon={faClock} 
            color="bg-yellow-500" 
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Revenue & Profit Chart */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Revenue & Profit</h3>
              <ChartToggle 
                chartKey="revenue" 
                currentView={chartViews.revenue} 
                onToggle={(view) => handleChartToggle('revenue', view)} 
              />
            </div>
            <div className="h-64 sm:h-80">
              {chartViews.revenue === 'pie' ? (
                <Doughnut {...chartConfigs.revenue.pie} />
              ) : (
                <Bar {...chartConfigs.revenue.bar} />
              )}
            </div>
          </div>

          {/* Customer Distribution Chart */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Customer Analytics</h3>
              <ChartToggle 
                chartKey="customers" 
                currentView={chartViews.customers} 
                onToggle={(view) => handleChartToggle('customers', view)} 
              />
            </div>
            <div className="h-64 sm:h-80">
              {customerInsights.newCustomers > 0 || customerInsights.repeatBuyers > 0 ? (
                chartViews.customers === 'pie' ? (
                  <Pie {...chartConfigs.customers.pie} />
                ) : (
                  <Bar {...chartConfigs.customers.bar} />
                )
              ) : (
                <EmptyState icon={faUsers} message="No customer data available" />
              )}
            </div>
          </div>

          {/* Product Sales Chart */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
              <ChartToggle 
                chartKey="products" 
                currentView={chartViews.products} 
                onToggle={(view) => handleChartToggle('products', view)} 
              />
            </div>
            <div className="h-64 sm:h-80">
              {topProducts.length > 0 ? (
                chartViews.products === 'pie' ? (
                  <Pie {...chartConfigs.products.pie} />
                ) : (
                  <Bar {...chartConfigs.products.bar} />
                )
              ) : (
                <EmptyState icon={faChartBar} message="No product sales data available" />
              )}
            </div>
          </div>

          {/* Deal Performance Chart */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Deals</h3>
              <ChartToggle 
                chartKey="deals" 
                currentView={chartViews.deals} 
                onToggle={(view) => handleChartToggle('deals', view)} 
              />
            </div>
            <div className="h-64 sm:h-80">
              {dealData.topDeals && dealData.topDeals.length > 0 ? (
                chartViews.deals === 'pie' ? (
                  <Pie {...chartConfigs.deals.pie} />
                ) : (
                  <Bar {...chartConfigs.deals.bar} />
                )
              ) : (
                <EmptyState icon={faRocket} message="No deal performance data available" />
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders & Low Stock - Parallel Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <NavLink to="/orders" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View all →
              </NavLink>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map(order => (
                  <div key={order._id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="flex items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                        <FontAwesomeIcon icon={faUsers} className="text-blue-600 text-sm sm:text-base" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">#{order._id?.toString().slice(-6)}</p>
                        <div className="flex items-center text-xs sm:text-sm text-gray-600 mt-1">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs mr-1" />
                          <span className="truncate">{order.user?.location || 'Unknown'}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {order.items?.slice(0, 2).map(item => `${item.quantity}x ${item.name}`).join(', ')}
                          {order.items?.length > 2 && `... +${order.items.length - 2} more`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">Rs {order.amount}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={faShoppingCart} message="No recent orders" />
              )}
            </div>
          </div>

          {/* Low Stock Section */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
              <NavLink to="/list" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Manage Inventory →
              </NavLink>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-3 sm:p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                    <div className="flex items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                        <FontAwesomeIcon icon={faExclamationCircle} className="text-red-600 text-sm sm:text-base" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{product.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{product.category} • Ideal: {product.idealStock}</p>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <StockBadge stock={product.quantity} />
                      <p className="text-xs text-gray-600 mt-1">Value: Rs {(product.quantity * product.cost).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={faBoxes} message="All products are well stocked" />
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 mb-6 sm:mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickActions.map((action, i) => (
              <NavLink 
                key={i} 
                to={action.to} 
                className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-gray-50 transition-all hover:bg-gray-100 hover:shadow-md"
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${action.color}`}>
                  <FontAwesomeIcon icon={action.icon} className="text-white text-sm sm:text-base" />
                </div>
                <span className="font-medium text-gray-900 text-sm sm:text-base">{action.text}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Notifications Modal */}
        {showAlertsModal && <AlertsModal />}
      </div>
    </div>
  );
};

export default Dashboard;
