# Jupyter Keys: Model Validation Patterns

**Version**: 1.0.0  
**Tool**: Jupyter  
**Maturity**: Operator  
**Outcome**: Validation

---

## What This Key Unlocks

Model validation workflows for Jupyter. This key unlocks:

- **Cross-Validation Patterns**: K-fold and stratified cross-validation
- **Performance Metrics**: Comprehensive metrics for classification and regression
- **Overfitting Detection**: Automated overfitting detection and analysis
- **Model Comparison**: Compare multiple models side-by-side

---

## Installation

1. **Install required packages**:
   ```bash
   pip install scikit-learn pandas numpy matplotlib seaborn
   ```

2. **Open the notebook**:
   ```bash
   jupyter notebook notebooks/model_validation.ipynb
   ```

---

## Usage

### Cross-Validation

```python
from sklearn.ensemble import RandomForestClassifier
from jupyter_model_validation import perform_cross_validation

model = RandomForestClassifier()
cv_results = perform_cross_validation(model, X_train, y_train, cv_folds=5)

print(f"CV Score: {cv_results['mean_score']:.3f} (+/- {cv_results['std_score']:.3f})")
```

### Performance Metrics

```python
from jupyter_model_validation import calculate_classification_metrics

model.fit(X_train, y_train)
y_pred = model.predict(X_test)
y_pred_proba = model.predict_proba(X_test)[:, 1]

metrics = calculate_classification_metrics(y_test, y_pred, y_pred_proba)
print(metrics)
```

### Overfitting Detection

```python
from jupyter_model_validation import detect_overfitting

results = detect_overfitting(model, X_train, y_train, X_test, y_test)

if results['is_overfitting']:
    print(f"Overfitting detected! Severity: {results['severity']}")
    print(f"Train score: {results['train_score']:.3f}")
    print(f"Test score: {results['test_score']:.3f}")
```

### Model Comparison

```python
from jupyter_model_validation import compare_models
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression

models = {
    'RandomForest': RandomForestClassifier(),
    'SVM': SVC(),
    'LogisticRegression': LogisticRegression()
}

comparison = compare_models(models, X_train, y_train, X_test, y_test)
print(comparison)
```

---

## Included Patterns

### 1. Cross-Validation
- K-fold cross-validation for regression
- Stratified k-fold for classification
- Configurable number of folds
- Multiple scoring metrics

### 2. Performance Metrics
- Classification: Accuracy, Precision, Recall, F1, ROC AUC
- Regression: MSE, RMSE, R² Score
- Weighted averages for multi-class problems

### 3. Overfitting Detection
- Train vs test score comparison
- Overfitting ratio calculation
- Severity classification (low/medium/high)
- Threshold-based detection

### 4. Model Comparison
- Side-by-side model comparison
- Cross-validation and test set scores
- Standard deviation reporting
- Sorted by performance

---

## Requirements

- Python 3.7+
- scikit-learn
- pandas
- numpy
- matplotlib
- seaborn

---

## License

MIT
