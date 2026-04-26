from setuptools import setup

setup(
    name="ai_risk_scoring",
    version="1.0.0",
    packages=['ai_risk_scoring', 'ai_risk_scoring.api', 'ai_risk_scoring.models',
              'ai_risk_scoring.data_processing', 'ai_risk_scoring.pipeline'],
    package_dir={'ai_risk_scoring': '.'},
    install_requires=[
        "pandas>=1.5.0",
        "numpy>=1.21.0",
        "scikit-learn>=1.1.0",
        "xgboost>=1.6.0",
        "joblib>=1.2.0",
        "flask>=2.2.0",
        "flask-cors>=4.0.0",
        "gunicorn>=20.1.0",
        "python-dotenv>=0.19.0",
        "pytest>=7.0.0",
        "pytest-cov>=4.0.0",
        "requests>=2.28.0",
        "prometheus-client>=0.15.0",
        "black>=22.0.0",
        "flake8>=5.0.0",
        "mypy>=0.991",
    ],
    python_requires=">=3.9",
)
