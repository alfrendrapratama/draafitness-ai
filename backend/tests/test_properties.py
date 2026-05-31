import unittest
import sys
import os
from hypothesis import given, strategies as st

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.calculator import (
    calculate_bmi, calculate_bmr, calculate_tdee,
    calculate_target_calories, calculate_macro_distribution
)

class TestCalculatorProperties(unittest.TestCase):

    # Property 1: BMI Calculation
    @given(weight=st.floats(min_value=30.0, max_value=300.0), 
           height=st.floats(min_value=100.0, max_value=250.0))
    def test_bmi_property(self, weight, height):
        bmi, category = calculate_bmi(weight, height)
        expected_bmi = round(weight / ((height / 100) ** 2), 2)
        self.assertAlmostEqual(bmi, expected_bmi, places=1)
        self.assertIn(category, ["Underweight", "Normal", "Overweight", "Obese"])

    # Property 4: Minimum Calorie Safety Invariant
    @given(tdee=st.floats(min_value=500.0, max_value=5000.0))
    def test_minimum_calorie_safety(self, tdee):
        for goal in ['weight_loss', 'maintenance', 'muscle_gain']:
            target = calculate_target_calories(tdee, goal)
            self.assertGreaterEqual(target, 1200.0)

    # Property 5: Macro Distribution Sums to Target Calories
    @given(target_calories=st.floats(min_value=1200.0, max_value=4000.0))
    def test_macro_distribution_sum(self, target_calories):
        for goal in ['weight_loss', 'maintenance', 'muscle_gain']:
            macros = calculate_macro_distribution(target_calories, goal)
            total_kcal = macros['protein']['kcal'] + macros['carbs']['kcal'] + macros['fat']['kcal']
            # Toleransi error pembulatan floating point ±1 kcal
            self.assertTrue(abs(total_kcal - target_calories) <= 1.0)

if __name__ == '__main__':
    unittest.main()