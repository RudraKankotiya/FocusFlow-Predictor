import streamlit as st
import joblib
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

# ========================================
# YOUR COLAB FUNCTIONS (PASTE THESE EXACTLY)
# ========================================
_MODEL_CACHE = None
_FEATURE_NAMES_CACHE = None
_FEATURE_MEANS_CACHE = None

def load_productivity_model_real():
    global _MODEL_CACHE, _FEATURE_NAMES_CACHE, _FEATURE_MEANS_CACHE
    if _MODEL_CACHE is None or _FEATURE_NAMES_CACHE is None or _FEATURE_MEANS_CACHE is None:
        print("Loading model...")
        _MODEL_CACHE = joblib.load('productivity_model_real.pkl')
        _FEATURE_NAMES_CACHE = joblib.load('feature_names_real.pkl')
        
        # Load data for means
        cleaned_df = pd.read_csv('productivity_data_real.csv')
        _FEATURE_MEANS_CACHE = {col: cleaned_df[col].mean() for col in _FEATURE_NAMES_CACHE if col in cleaned_df.columns}
        print("Model loaded!")
    return _MODEL_CACHE, _FEATURE_NAMES_CACHE, _FEATURE_MEANS_CACHE

def predict_productive_score(phone_hours, sleep_hours=None, notifications_per_day=None, work_hours_per_day=None):
    model, feature_names, feature_means = load_productivity_model_real()
    
    input_kwargs = {
        'phone_hours': phone_hours,
        'sleep_hours': sleep_hours,
        'notifications_per_day': notifications_per_day,
        'work_hours_per_day': work_hours_per_day
    }
    
    feature_vector = []
    for feature in feature_names:
        value = input_kwargs.get(feature)
        if value is not None:
            feature_vector.append(value)
        else:
            feature_vector.append(feature_means.get(feature, 0))
    
    X_predict = np.array(feature_vector).reshape(1, -1)
    prediction = model.predict(X_predict)[0]
    return float(np.clip(prediction, 0, 10))

def generate_productivity_message_score(predicted_score, historical_mean=None):
    if predicted_score < 3.0:
        label = "🔴 Very Low"
    elif predicted_score < 5.0:
        label = "🟡 Below Average" 
    elif predicted_score < 7.5:
        label = "🟢 Decent"
    else:
        label = "🟢 High Productivity"
    
    message = f"Predicted: {predicted_score:.1f}/10 ({label})"
    if historical_mean:
        if predicted_score >= historical_mean * 1.1:
            message += " ⭐ Better than average!"
        elif predicted_score <= historical_mean * 0.9:
            message += " ⚠️ Below your usual performance"
    return label, message
# ========================================
# END OF YOUR FUNCTIONS
# ========================================

# Page config
st.set_page_config(
    page_title="FocusFlow Predictor",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for pro look
st.markdown("""
<style>
.main .block-container {padding-top: 2rem;}
.metric-container {text-align: center;}
.stSlider > div > div > div {background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);}
</style>
""", unsafe_allow_html=True)

# Header
st.title("🎯 **FocusFlow Predictor**")
st.markdown("### Predict your daily productivity score from sleep + screen habits")
st.markdown("*Built by Rudra Kankotiya | ML Engineer Student*")

# Sidebar info
with st.sidebar:
    st.header("📊 About")
    st.info("""
    **Dataset:** Kaggle "Social Media vs Productivity" (30K records)
    **Model:** RandomForestRegressor (your best model)
    **Skills:** End-to-end ML → Web deployment
    """)
    
    st.header("🔗 Links")
    st.markdown("[GitHub Repo](https://github.com/)")
    st.markdown("[Kaggle Dataset](https://www.kaggle.com/datasets/mahdimashayekhi/social-media-vs-productivity)")

# Main content - Tabs
tab1, tab2, tab3 = st.tabs(["🔮 Predict", "📈 Insights", "⚙️ Optimizer"])

# Tab 1: Predictor (main feature)
with tab1:
    st.header("**Plan your day → See productivity score**")
    
    # Input sliders (beautiful layout)
    col1, col2 = st.columns([1,1], gap="large")
    with col1:
        phone_hours = st.slider(
            "📱 **Phone/Social hours**", 
            0.0, 8.0, 2.5, 0.25,
            help="Lower = higher productivity"
        )
    with col2:
        sleep_hours = st.slider(
            "😴 **Sleep hours last night**", 
            4.0, 10.0, 7.0, 0.25,
            help="7-8h is usually optimal"
        )
    
    # Predict button
    col1, col2 = st.columns([3,1])
    with col1:
        if st.button("🚀 **Predict My Productivity**", type="primary", use_container_width=True):
            with st.spinner("Analyzing your habits..."):
                pred = predict_productive_score(phone_hours=phone_hours, sleep_hours=sleep_hours)
                label, msg = generate_productivity_message_score(pred)
                
                # Big result metric
                st.markdown("---")
                st.metric("**Daily Productivity Score**", f"{pred:.1f}", " /10")
                
                # Status badge
                st.markdown(f"**{label}**")
                st.success(msg)
                
                # Quick tips
                st.info("💡 **Pro tip:** Try phone <2h + sleep 7-8h for best results!")
    
    # Mini chart: impact visualization
    st.markdown("### 📊 How changes affect your score")
    phone_range = np.arange(0, 6.1, 0.5)
    preds = [predict_productive_score(p, sleep_hours) for p in phone_range]
    fig = px.line(
        x=phone_range, y=preds, 
        title="Phone time impact (fixed sleep)",
        labels={'x':'Phone Hours', 'y':'Predicted Score'}
    )
    st.plotly_chart(fig, use_container_width=True)

# Tab 2: Dataset insights
with tab2:
    st.header("**Dataset Overview**")
    
    # Load & show data
    @st.cache_data
    def load_data():
        return pd.read_csv('productivity_data_real.csv')
    
    df = load_data()
    
    # Key metrics
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("📱 Avg Phone Hours", f"{df['phone_hours'].mean():.1f}")
    col2.metric("😴 Avg Sleep Hours", f"{df['sleep_hours'].mean():.1f}" if 'sleep_hours' in df else "N/A")
    col3.metric("⭐ Avg Productivity", f"{df['productive_score'].mean():.1f}/10")
    col4.metric("📊 Records", f"{len(df):,}")
    
    # Correlation heatmap
    st.subheader("🔗 Key Correlations")
    numeric_cols = df.select_dtypes(include=np.number).columns
    corr = df[numeric_cols].corr()
    fig = px.imshow(corr, 
                   title="Feature Correlations", 
                   color_continuous_scale="RdBu_r",
                   aspect="auto")
    st.plotly_chart(fig, use_container_width=True)
    
    # Data preview
    st.subheader("📋 Sample Data")
    st.dataframe(df[['phone_hours', 'productive_score']].head(10).style.format("{:.2f}"))

# Tab 3: Schedule optimizer  
with tab3:
    st.header("**Optimal Schedule Finder**")
    
    st.markdown("Find your best sleep + phone combo...")
    
    col1, col2 = st.columns(2)
    with col1:
        phone_max = st.slider("Max phone hours to consider", 2.0, 6.0, 4.0)
    with col2:
        sleep_target = st.slider("Ideal sleep hours", 6.0, 9.0, 7.5)
    
    if st.button("🔍 Find Best Schedule", type="secondary"):
        # Simple grid search demo
        phone_opts = np.arange(0.5, phone_max+0.5, 0.5)
        sleep_opts = np.arange(6.0, 9.0, 0.5)
        
        results = []
        for p in phone_opts:
            for s in sleep_opts:
                score = predict_productive_score(p, s)
                results.append({"Phone": p, "Sleep": s, "Score": score})
        
        df_results = pd.DataFrame(results)
        df_results = df_results.sort_values("Score", ascending=False).head(5)
        
        st.dataframe(df_results.style.format({"Phone": "{:.1f}", "Sleep": "{:.1f}", "Score": "{:.1f}"}))
        
        # Best combo highlight
        best = df_results.iloc[0]
        st.success(f"**🏆 Best: Sleep {best['Sleep']:.1f}h + Phone {best['Phone']:.1f}h = {best['Score']:.1f}/10**")

# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #666;'>
✨ **Rudra Kankotiya** | Engineering Student | ML + Competitive Programming
</div>
""", unsafe_allow_html=True)
