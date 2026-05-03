import pandas as pd
from sklearn.linear_model import LinearRegression

def apply_ema(df, span=5):

    df["ema"] = df['e1rm'].ewm(span=span, adjust=False).mean()
    return df

def rolling_slope(df):

    X = df.reset_index(drop=True).index.values.reshape(-1, 1)
    y = df['ema'].values

    model = LinearRegression()
    model.fit(X, y)

    residuals = y - model.predict(X)
    residual_std = residuals.std()

    return model.coef_[0], residual_std

def comparison(df):

    latest_data = df['date'].max()
    recent = latest_data - pd.Timedelta(days=14)
    past = latest_data - pd.Timedelta(days=28)

    recent_df = df[df['date'] >= recent]
    past_df = df[(df['date'] < recent) & (df['date'] >= past)]

    if len(recent_df) == 0 or len(past_df)==0:
        return None, None
    
    recent_avg = recent_df["e1rm"].mean()
    past_avg = past_df["e1rm"].mean()

    return recent_avg, past_avg

def classify(slope, recent_avg, past_avg, recent_std):
    if slope is None or recent_avg is None or past_avg is None:
        return None

    # noise-aware threshold
    threshold = recent_std * 0.5

    level_change = recent_avg - past_avg

    if slope > threshold and level_change > threshold:
        return "+"

    elif slope < -threshold and level_change < -threshold:
        return "-"

    else:
        return "~"


def analyze_performance(data):

    df = pd.DataFrame(data)

    if len(df) < 6:
        return {"Message": 'Not enough data'}

    df['date'] = pd.to_datetime(df['date'])
    df = apply_ema(df)

    slope, residual_std = rolling_slope(df)
    recent_avg, past_avg = comparison(df)

    status = classify(slope, recent_avg, past_avg, residual_std)

    return {
        "status" : status,
        "slope" : slope,
        
    }