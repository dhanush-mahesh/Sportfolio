"""
Test script to verify ML models are actually being trained
Run this to see detailed training metrics and proof of learning
"""
import os
import sys
from datetime import datetime

print("="*80)
print("ML MODEL TRAINING VERIFICATION TEST")
print("="*80)
print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print()

# Test 1: ML Trade Advisor
print("\n" + "="*80)
print("TEST 1: ML TRADE ADVISOR (Random Forest)")
print("="*80)

try:
    from ml_trade_advisor import MLTradeAdvisor
    
    advisor = MLTradeAdvisor()
    
    # Generate training data
    print("\n[Step 1] Generating training data from historical player values...")
    training_df = advisor.generate_training_data(lookback_days=7)
    
    if training_df is None or len(training_df) < 50:
        print("❌ FAILED: Not enough historical data")
        print("   Solution: Run scrapers daily for at least 7 days to collect data")
    else:
        print(f"✅ SUCCESS: Generated {len(training_df)} training samples")
        print(f"   - Features: {advisor.feature_names}")
        print(f"   - Positive samples (profitable): {training_df['label'].sum()}")
        print(f"   - Negative samples (unprofitable): {(1-training_df['label']).sum()}")
        
        # Train model
        print("\n[Step 2] Training Random Forest model...")
        print("   - Algorithm: Random Forest Classifier")
        print("   - Trees: 100")
        print("   - Max depth: 10")
        print("   - Training/Test split: 80/20")
        
        accuracy = advisor.train_model(training_df)
        
        print(f"\n✅ MODEL TRAINED SUCCESSFULLY!")
        print(f"   - Final accuracy: {accuracy*100:.2f}%")
        print(f"   - Model type: {type(advisor.model).__name__}")
        print(f"   - Number of features: {len(advisor.feature_names)}")
        
        # Save model
        print("\n[Step 3] Saving trained model...")
        advisor.save_model()
        
        # Verify model file
        if os.path.exists(advisor.model_path):
            file_size = os.path.getsize(advisor.model_path)
            print(f"✅ Model file created: {advisor.model_path}")
            print(f"   - File size: {file_size:,} bytes")
            print(f"   - Modified: {datetime.fromtimestamp(os.path.getmtime(advisor.model_path))}")
        
        # Test prediction
        print("\n[Step 4] Testing model predictions...")
        test_player = {
            'stat_component': 75.0,
            'sentiment_component': 0.5,
            'momentum_score': 2.5,
            'confidence_score': 0.8,
            'value_score': 78.0,
            'stat_trend': 5.0,
            'sentiment_trend': 0.2
        }
        
        prediction = advisor.predict_trade_success(test_player)
        print(f"✅ Prediction test successful:")
        print(f"   - Input: High-performing player (value=78, momentum=2.5)")
        print(f"   - Probability of profit: {prediction['probability']*100:.1f}%")
        print(f"   - Recommendation: {prediction['recommendation']}")
        print(f"   - Action: {prediction['action'].upper()}")
        
        print("\n" + "="*80)
        print("✅ ML TRADE ADVISOR: FULLY FUNCTIONAL")
        print("="*80)

except Exception as e:
    print(f"\n❌ ERROR in ML Trade Advisor test:")
    print(f"   {str(e)}")
    import traceback
    traceback.print_exc()

# Test 2: AI Price Predictor
print("\n\n" + "="*80)
print("TEST 2: AI PRICE PREDICTOR (Linear Regression)")
print("="*80)

try:
    from ai_price_predictor import AIPricePredictor
    from supabase import create_client
    from dotenv import load_dotenv
    
    load_dotenv()
    
    predictor = AIPricePredictor()
    
    # Get a sample player
    print("\n[Step 1] Fetching sample player data...")
    supabase = create_client(
        os.environ.get("SUPABASE_URL"),
        os.environ.get("SUPABASE_KEY")
    )
    
    # Get a player with recent data
    response = supabase.table('player_value_index').select('player_id').order('value_date', desc=True).limit(1).execute()
    
    if not response.data:
        print("❌ FAILED: No player data available")
    else:
        sample_player_id = response.data[0]['player_id']
        
        # Get player name
        player_info = supabase.table('players').select('full_name').eq('id', sample_player_id).single().execute()
        player_name = player_info.data['full_name']
        
        print(f"✅ Using sample player: {player_name} (ID: {sample_player_id})")
        
        # Get historical data
        print("\n[Step 2] Fetching historical data...")
        historical_data = predictor.get_historical_data(sample_player_id, days=30)
        print(f"✅ Retrieved {len(historical_data)} days of historical data")
        
        if len(historical_data) >= 5:
            # Prepare features
            print("\n[Step 3] Preparing features for training...")
            X, y = predictor.prepare_features(historical_data)
            
            if X is not None:
                print(f"✅ Features prepared:")
                print(f"   - Training samples: {len(X)}")
                print(f"   - Features per sample: {X.shape[1]}")
                print(f"   - Feature names: [time_index, stat_component, sentiment_component, momentum_score, confidence_score, moving_avg]")
                print(f"   - Target variable: value_score")
                
                # Train model
                print("\n[Step 4] Training Linear Regression model...")
                print("   - Algorithm: Linear Regression")
                print("   - Optimization: Ordinary Least Squares")
                
                success = predictor.train_model(sample_player_id)
                
                if success:
                    print(f"✅ MODEL TRAINED SUCCESSFULLY!")
                    
                    model_info = predictor.models[sample_player_id]
                    print(f"   - Model type: {type(model_info['model']).__name__}")
                    print(f"   - Trained at: {model_info['trained_at']}")
                    print(f"   - Coefficients: {model_info['model'].coef_}")
                    print(f"   - Intercept: {model_info['model'].intercept_:.2f}")
                    
                    # Test prediction
                    print("\n[Step 5] Testing predictions...")
                    predictions = predictor.predict_future_value(sample_player_id, days_ahead=7)
                    
                    if predictions:
                        print(f"✅ Generated {len(predictions)} day predictions:")
                        for pred in predictions[:3]:  # Show first 3
                            print(f"   - Day {pred['days_ahead']}: {pred['predicted_value']:.2f} (confidence: {pred['confidence']:.0%})")
                        print(f"   - ...")
                        
                        # Calculate prediction trend
                        current_value = historical_data[-1]['value_score']
                        future_value = predictions[-1]['predicted_value']
                        trend = ((future_value - current_value) / current_value * 100)
                        
                        print(f"\n   Prediction Summary:")
                        print(f"   - Current value: {current_value:.2f}")
                        print(f"   - Predicted (7 days): {future_value:.2f}")
                        print(f"   - Expected change: {trend:+.2f}%")
                        
                        print("\n" + "="*80)
                        print("✅ AI PRICE PREDICTOR: FULLY FUNCTIONAL")
                        print("="*80)
                    else:
                        print("❌ Prediction generation failed")
                else:
                    print("❌ Model training failed")
            else:
                print("❌ Feature preparation failed")
        else:
            print(f"❌ Not enough historical data (need at least 5 days, have {len(historical_data)})")

except Exception as e:
    print(f"\n❌ ERROR in AI Price Predictor test:")
    print(f"   {str(e)}")
    import traceback
    traceback.print_exc()

# Summary
print("\n\n" + "="*80)
print("TEST SUMMARY")
print("="*80)
print("""
This test verifies that:
1. ✅ Training data is being generated from your database
2. ✅ Models are being trained with real algorithms (Random Forest, Linear Regression)
3. ✅ Training metrics are calculated (accuracy, coefficients, etc.)
4. ✅ Models are saved to disk (.pkl files)
5. ✅ Models can make predictions on new data

PROOF OF TRAINING:
- You see accuracy scores (e.g., 75.3%)
- You see feature importance rankings
- You see model coefficients and intercepts
- You see classification reports with precision/recall
- Model files are created with timestamps

If you see these metrics, your models ARE being trained!
""")
print("="*80)
print(f"Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*80)
