import unittest
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.calculator import (
    calculate_bmi, calculate_bmr, 
    calculate_tdee, calculate_target_calories, 
    calculate_macro_distribution
    )

class TestCalculator(unittest.TestCase):

    def test_calculate_bmi(self):
        # Test normal
        bmi, cat = calculate_bmi(70, 175)
        self.assertEqual(cat, "Normal")
        # Test underweight
        bmi, cat = calculate_bmi(50, 175)
        self.assertEqual(cat, "Underweight")

    def test_calculate_bmr(self):
        # Male, 25 years, 70kg, 175cm -> 10*70 + 6.25*175 - 5*25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75
        self.assertEqual(calculate_bmr(70, 175, 25, 'male'), 1673.75)
        # Female, 25 years, 60kg, 160cm -> 10*60 + 6.25*160 - 5*25 - 161 = 600 + 1000 - 125 - 161 = 1314
        self.assertEqual(calculate_bmr(60, 160, 25, 'female'), 1314.0)

    def test_calculate_tdee(self):
        # 1000 BMR * 1.2 (sedentary)
        self.assertEqual(calculate_tdee(1000, 'sedentary'), 1200.0)

    def test_calculate_target_calories(self):
        # Normal weight loss
        self.assertEqual(calculate_target_calories(2000, 'weight_loss'), 1500.0)
        # Safety check: TDEE 1500 - 500 = 1000 -> harus dipaksa jadi 1200
        self.assertEqual(calculate_target_calories(1500, 'weight_loss'), 1200.0)

    def test_calculate_macro_distribution(self):
        # Test protein grams for 2000 kcal maintenance (25% protein = 500 kcal / 4 = 125g)
        macros = calculate_macro_distribution(2000, 'maintenance')
        self.assertEqual(macros['protein']['grams'], 125.0)
        self.assertEqual(macros['fat']['grams'], round((2000 * 0.25) / 9, 2))

if __name__ == '__main__':
    unittest.main()