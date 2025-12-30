# -*- coding: utf-8 -*-
"""
@author: Edwald
"""
import argparse
import time
import datetime
import os.path
import pandas as pd
import requests
import json

if not os.path.exists('results'):
    os.mkdir('results')

def date(string):
    time.strptime(string, "%Y-%m")
    return string
print()
parser = argparse.ArgumentParser(description='Sensor Tower utility script. Query estimated app downloads and revenue.\nPut your api token inside the token.txt file')
parser.add_argument('--date', type=date, help='yyyy-mm. The month of the required app statistics. Defaults to last month.')
parser.add_argument('--category', default='6014', help='string. The app category')
parser.add_argument('--min-download', default=300000, type=int, help='integer. The minimum number of downloads. Defaults to 300000')
parser.add_argument('--min-contribution', default=0.5, type=float, help='(0,1). The minimum contribution ratio. Defaults to 0.5')
args = parser.parse_args()

MONTH_SALES_URL = 'https://api.sensortower.com/v1/unified/sales_report_estimates_comparison_attributes?'\
                'comparison_attribute=delta&'\
                'time_range=month&'\
                'measure=units&'\
                'device_type=total&'\
                'category={category:}&'\
                'date={date:}&'\
                'end_date={end_date:}&'\
                'country=US&'\
                'limit=2000&'\
                'custom_tags_mode=include_unified_apps&'\
                'auth_token={auth_token:}'

APPS_URL = 'https://api.sensortower.com/v1/unified/apps?'\
                'app_id_type=unified&'\
                'app_ids={app_ids:}&'\
                'auth_token={auth_token:}'

ALLTIME_SALES_URL = 'https://api.sensortower.com/v1/unified/sales_report_estimates?'\
                'app_ids={app_ids:}&'\
                'date_granularity=monthly&'\
                'start_date=2012-01-01&'\
                'end_date={end_date:}&'\
                'countries=US&'\
                'auth_token={auth_token:}'

PUBLISHER_URL = 'https://api.sensortower.com/v1/unified/publishers?'\
                'publisher_id_type=unified&'\
                'publisher_ids={publisher_ids:}&'\
                'auth_token={auth_token:}'

APP_ANDROID_INFO = 'https://api.sensortower.com/v1/android/apps?'\
                'app_ids={app_ids:}&'\
                'country=US&'\
                'auth_token={auth_token}'

APP_IOS_INFO = 'https://api.sensortower.com/v1/ios/apps?'\
                'app_ids={app_ids:}&'\
                'country=US&'\
                'auth_token={auth_token}'
    
def main():
    token = open('token.txt', 'r').read()
    print("token="+token)
    print()
    date_val = args.date
    if not args.date:
        today = datetime.date.today()
        # Correctly format year and month as a string that can be parsed by date function or MONTH_SALES_URL
        date_val = "{year:}-{month:02d}".format(year=today.year, month=today.month)
    
    df = generate_table(token, date_val, args.category, args.min_download, args.min_contribution)
    if not df.empty:
        df.to_csv('results/ST-{date:}.csv'.format(date=date_val), sep='\t', index=False)
    else:
        print("No data found or error occurred.")
    return


def generate_table(token, date, category, min_download, min_contribution):
    
    final_df = pd.DataFrame(columns=['App Id', 'App Name', 'Publisher Id', 'Publisher Name', 'Date',
                'Absolute (Downloads)', 'Change (Downloads)', 'Cumulative (Downloads)', 'Contribute (Downloads)',
                'iOS Release Date', 'Android Release Date', 'Game Genre', 'Game Sub-genre'])
    
    month_df = get_month_sales(token, date, category, min_download)
    if month_df.empty:
        return final_df
    app_ids = list(month_df['app_id'])
    alltime_df = get_app_alltime_sales(token, date, app_ids)
    app_names = get_app_names(token, app_ids)
    
    # Merge and transform...
    # (Leaving rest of logic same for now)
    return month_df # Returning month_df just to see if we get anything

def get_month_sales(token, date, category, min_download):
    print('Querying app comparison sales of the month {m:}...'.format(m=date))
    start_date = date+'-01'
    end_date = date+'-28' # Use 28 to be safe for all months in a quick test
    url = MONTH_SALES_URL.format(category=category, date=start_date, end_date=end_date, auth_token=token)
    print(f"URL: {url}")
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            df = pd.read_json(response.text)
            df.sort_values(by='units_delta', ascending=False)
            df = df.query('units_absolute >= {value:}'.format(value=min_download))
            print("Done.")
            return df
        else:
            print(f"Response: {response.text}")
            return pd.DataFrame()
    except Exception as e:
        print(f"Error: {e}")
        return pd.DataFrame()

def get_app_alltime_sales(token, date, app_ids):
    return pd.DataFrame() # Mocked for quick test

def get_app_names(token, app_ids):
    return pd.DataFrame() # Mocked for quick test

def get_app_publishers(token, publisher_ids):
    return pd.DataFrame() # Mocked for quick test

if __name__=="__main__":
    main()
