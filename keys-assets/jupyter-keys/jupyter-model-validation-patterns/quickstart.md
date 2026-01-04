# Quick Start: Jupyter Model Validation Patterns

Get model validation working in 3 minutes.

---

## Step 1: Install Dependencies

```bash
pip install scikit-learn pandas numpy matplotlib seaborn
```

---

## Step 2: Open Notebook

```bash
jupyter notebook notebooks/model_validation.ipynb
```

---

## Step 3: Load Your Data

```python
# Replace with your data loading code
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split

data = load_iris()
X, y = data.data, data.target
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
```

---

## Step 4: Run Validation

```python
# Copy functions from notebook cells
# Then run:

from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier()
cv_results = perform_cross_validation(model, X_train, y_train)
print(f"CV Score: {cv_results['mean_score']:.3f}")
```

---

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Customize validation patterns for your use case
- Add more models to comparison

---

**That's it!** You're ready to validate your models.
