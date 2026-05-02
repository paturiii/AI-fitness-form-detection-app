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

    return model.coef_[0]

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

def classify(slope, recent_avg, past_avg, mean_e1rm):
    if slope is None or recent_avg is None:
        return None
    
    threshold = mean_e1rm * 0.01

    if slope > threshold and recent_avg > past_avg:
        return "+"
    
    elif slope < -threshold and recent_avg < past_avg:
        return "-"
    
    else:
        return "~"


def analyze_performance(data):

    df = pd.DataFrame(data)

    if len(df) < 6:
        return {"Message": 'Not enough data'}

    df['date'] = pd.to_datetime(df['date'])
    df = apply_ema(df)

    slope = rolling_slope(df)
    recent_avg, past_avg = comparison(df)
    mean_e1rm = df['e1rm'].mean()

    status = classify(slope, recent_avg, past_avg, mean_e1rm)

    return {
        "status" : status,
        "slope" : slope,
        
    }