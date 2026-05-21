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
    """Compare recent vs older performance.

    Prefer calendar windows (last 14 days vs prior 14 days). Many users log
    workouts weekly or sporadically, so those windows are often empty — fall back
    to the mean of the latest half of sessions vs the first half.
    """
    df = df.sort_values("date").reset_index(drop=True)
    latest_data = df["date"].max()
    recent_cut = latest_data - pd.Timedelta(days=14)
    past_start = latest_data - pd.Timedelta(days=28)

    recent_df = df[df["date"] >= recent_cut]
    past_df = df[(df["date"] < recent_cut) & (df["date"] >= past_start)]

    if len(recent_df) > 0 and len(past_df) > 0:
        return float(recent_df["e1rm"].mean()), float(past_df["e1rm"].mean())

    n = len(df)
    if n < 4:
        return None, None
    mid = n // 2
    past_df = df.iloc[:mid]
    recent_df = df.iloc[mid:]
    return float(recent_df["e1rm"].mean()), float(past_df["e1rm"].mean())

def classify(slope, recent_avg, past_avg, residual_std, mean_e1rm: float):
    """
    Trend labels: + / - / ^ (plateau).

    residual_std measures scatter of EMA around a line (same units as e1RM).
    slope is e1RM change per session index — much smaller than raw e1RM deltas,
    so using one threshold for both was wrongly suppressing real declines (and
    growth) whenever the series was noisy.
    """
    if slope is None or recent_avg is None or past_avg is None:
        return None

    if residual_std is None or pd.isna(residual_std):
        residual_std = 0.0

    level_change = recent_avg - past_avg
    scale = max(abs(float(mean_e1rm)), 1.0)

    # Level gate: same units as e1RM
    level_thr = max(0.5, float(residual_std) * 0.4, scale * 0.015)

    # Slope gate: e1RM per index step — use a tighter fraction of residual noise
    slope_thr = max(0.04, float(residual_std) * 0.12, scale * 0.008)

    if slope > slope_thr and level_change > level_thr:
        return "+"

    if slope < -slope_thr and level_change < -level_thr:
        return "-"

    return "^"


def analyze_performance(data):

    df = pd.DataFrame(data)

    if len(df) < 6:
        return {"Message": 'Not enough data'}

    df['date'] = pd.to_datetime(df['date'])
    mean_e1rm = float(df["e1rm"].mean())
    df = apply_ema(df)

    slope, residual_std = rolling_slope(df)
    recent_avg, past_avg = comparison(df)

    status = classify(slope, recent_avg, past_avg, residual_std, mean_e1rm)

    return {
        "status": status,
        "slope": float(slope) if slope is not None and not pd.isna(slope) else 0.0,
    }