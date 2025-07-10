
# Suicide Detection System

## Overview
This project implements a machine learning-based system for detecting suicidal ideation in text content. By analyzing textual data, the system aims to identify individuals who may be at risk of suicide, enabling early intervention and support.

## Motivation
Suicide is a global public health concern. Early detection of suicidal thoughts through online content analysis can potentially save lives by facilitating timely intervention. This tool is designed to assist mental health professionals and support systems in identifying at-risk individuals.

## Features
- Text preprocessing and feature extraction
- Multiple classification models for suicide risk assessment
- Performance evaluation metrics and comparison
- User-friendly interface for real-time text analysis
  ![Screenshot 2025-04-20 225738](https://github.com/user-attachments/assets/357ccaee-100a-4fdc-9d88-b400f7e18283)
![Screenshot 2025-04-20 225706](https://github.com/user-attachments/assets/935285fc-c284-4dd8-be35-8214d141ae2c)

![Screenshot 2025-04-20 225952](https://github.com/user-attachments/assets/b9096f55-70b1-4996-bceb-2c55ae51cae4)

## Dataset
The system was trained on datasets containing:
- Social media posts labeled for suicidal content
- Text from suicide prevention forums
- Control data from general conversation sources

## Technology Stack
- Python 3.x
- Scikit-learn for machine learning models
- NLTK and spaCy for natural language processing
- TensorFlow/Keras for deep learning models
- Flask/FastAPI for API development (if applicable)

## Installation
1. Clone the repository:
```
git clone https://github.com/ARoop01/SuicideDetection.git
cd SuicideDetection
```

2. Create a virtual environment (recommended):
```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```
pip install -r requirements.txt
```

## Usage
1. Prepare your data according to the format specified in `data/README.md`
2. Train the model:
```
python src/train.py --config config/default.json
```
3. Evaluate the model:
```
python src/evaluate.py --model_path models/trained_model.pkl --test_data data/test.csv
```
4. Run the prediction script on new data:
```
python src/predict.py --input "text to analyze" --model_path models/trained_model.pkl
```

## Model Performance
The system implements multiple classification approaches:
- Traditional ML: Random Forest, SVM, Gradient Boosting
- Deep Learning: LSTM, BERT-based models

Performance metrics on test data:(till 10 epochs,can achieve more accuaracy)
- Accuracy: 85-92%
- Precision: 80-88%
- Recall: 82-90%
- F1 Score: 81-89%
  ![Screenshot 2025-04-20 230135](https://github.com/user-attachments/assets/08e12696-ff08-4487-8bf1-ac9f3438e29b)


## Ethical Considerations
This tool is intended as a support system, not a replacement for professional mental health assessment. False positives and false negatives can occur. Always consult mental health professionals for proper diagnosis and treatment.

The system should be used with strict privacy controls and informed consent when possible. Be aware of regional regulations regarding mental health data processing.

## Contributing
Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to contribute to this project.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact
- Researcher: ARoop01
- Project Link: [https://github.com/ARoop01/SuicideDetection](https://github.com/ARoop01/SuicideDetection)

## Acknowledgments
- Mental health researchers and practitioners who provided guidance
- Contributors of the datasets used for training and evaluation
- Open source NLP and machine learning communities
