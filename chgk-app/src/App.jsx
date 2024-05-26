import React from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';
import './App.css';
import questions from './questions.json';

const initializeAssistant = (getState /*: any*/) => {
    if (process.env.NODE_ENV === 'development') {
        return createSmartappDebugger({
            token: process.env.REACT_APP_TOKEN ?? '',
            initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
            getState,
        });
    } else {
        return createAssistant({ getState });
    }
};

export class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentQuestionIndex: this.getRandomIndex(),
            answer: '',
            feedback: '',
            attemptCount: 0,
            correctAnswer: '',
            comment: '',
        };

        this.assistant = initializeAssistant(() => this.getStateForAssistant());

        this.assistant.on('data', (event /*: any*/) => {
            console.log(`assistant.on(data)`, event);
            if (event.type === 'character') {
                console.log(`assistant.on(data): character: "${event?.character?.id}"`);
            } else if (event.type === 'insets') {
                console.log(`assistant.on(data): insets`);
            } else {
                const { action } = event;
                this.dispatchAssistantAction(action);
            }
        });

        this.assistant.on('start', (event) => {
            let initialData = this.assistant.getInitialData();
            console.log(`assistant.on(start)`, event, initialData);
        });

        this.assistant.on('command', (event) => {
            console.log(`assistant.on(command)`, event);
        });

        this.assistant.on('error', (event) => {
            console.log(`assistant.on(error)`, event);
        });

        this.assistant.on('tts', (event) => {
            console.log(`assistant.on(tts)`, event);
        });
    }

    componentDidMount() {
        console.log('componentDidMount');
    }

    getRandomIndex() {
        return Math.floor(Math.random() * questions.length);
    }

    getStateForAssistant() {
        const state = {
            question: {
                currentQuestion: questions[this.state.currentQuestionIndex].questionText,
            },
        };
        return state;
    }

    dispatchAssistantAction(action) {
        console.log('dispatchAssistantAction', action);
        if (action) {
            switch (action.type) {
                case 'enter_answer':
                    return this.enter_answer(action);

                case 'check_answer':
                    return this.check_answer(action);

                case 'next_question':
                    return this.next_question();

                default:
                    throw new Error();
            }
        }
    }

    enter_answer(action) {
        console.log('enter_answer', action);
        this.setState({ answer: action.answer });
    }

    check_answer(action) {
        console.log('check_answer', action);
        const { currentQuestionIndex, attemptCount, answer } = this.state;
        const currentQuestion = questions[currentQuestionIndex];
        const correctAnswers = currentQuestion.questionAnswer.split(';').map(ans => ans.trim().toLowerCase());
        const userAnswer = action.answer || answer.trim().toLowerCase();

        if (correctAnswers.includes(userAnswer)) {
            this.setState({
                feedback: 'Правильно!',
                attemptCount: 0,
                comment: currentQuestion.questionComment,
                correctAnswer: '',
            });
        } else {
            if (attemptCount === 0) {
                this.setState({
                    feedback: 'Неправильно. Попробуйте ещё раз.',
                    attemptCount: 1,
                });
            } else {
                this.setState({
                    feedback: 'Неправильно. Правильный ответ:',
                    correctAnswer: currentQuestion.questionAnswer,
                    comment: currentQuestion.questionComment,
                });
            }
        }
    }

    next_question() {
        this.setState({
            currentQuestionIndex: this.getRandomIndex(),
            answer: '',
            feedback: '',
            correctAnswer: '',
            attemptCount: 0,
            comment: '',
        });
    }

    handleChange = (event) => {
        this.setState({ answer: event.target.value });
    };

    handleSubmit = () => {
        this.check_answer({ answer: this.state.answer });
    };

    render() {
        const { currentQuestionIndex, answer, feedback, correctAnswer, comment } = this.state;

        return (
            <div className="App">
                <header className="App-header">
                    <h1>Что? Где? Когда?</h1>
                    <p>{questions[currentQuestionIndex].questionText}</p>
                    <input
                        type="text"
                        value={answer}
                        onChange={this.handleChange}
                        placeholder="Введите ответ"
                    />
                    <button className="submit-button" onClick={this.handleSubmit}>Проверить ответ</button>
                    <p>{feedback}</p>
                    {feedback === 'Неправильно. Правильный ответ:' && <p>{correctAnswer}</p>}
                    {comment && <p>{comment}</p>}
                    <button className="next-button" onClick={() => this.next_question()}>Следующий случайный вопрос</button>
                </header>
            </div>
        );
    }
}

export default App;
