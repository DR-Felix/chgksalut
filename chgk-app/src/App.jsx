import React from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';
import './App.css';
import questions from './questions.json';

const initializeAssistant = (getState) => {
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
            comment: '',
            hasAnswered: false,
        };

        this.assistant = initializeAssistant(() => this.getStateForAssistant());

        this.assistant.on('data', (event) => {
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
        window.addEventListener('resize', this.adjustFontSize); // Добавляем обработчик изменения размера окна
        this.adjustFontSize();
        console.log('componentDidMount');
    }

    componentDidUpdate() {
        this.adjustFontSize();
        console.log('componentDidUpdate');
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.adjustFontSize); // Удаляем обработчик изменения размера окна
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

                case 'read_question':
                    return this.read_question();

                default:
                    throw new Error();
            }
        }
    }

    enter_answer(action) {
        console.log('enter_answer', action);
        this.setState({ answer: action.answer });
    }

    _send_action_value(action_id, value) {
        const data = {
            action: {
                action_id: action_id,
                parameters: {
                    value: value,
                },
            },
        };
        const unsubscribe = this.assistant.sendData(data, (data) => {
            const { type, payload } = data;
            console.log('sendData onData:', type, payload);
            unsubscribe();
        });
    }


    check_answer(action) {
        console.log('check_answer', action);
        let { currentQuestionIndex, answer } = this.state;
        const currentQuestion = questions[currentQuestionIndex];
        let correctAnswers = currentQuestion.questionAnswer.split(';').map(ans => ans.trim());
        const userAnswer = action.answer || answer.trim().toLowerCase();
        const correctAnswer = correctAnswers[0];
        correctAnswers = currentQuestion.questionAnswer.split(';').map(ans => ans.trim().toLowerCase());

        let feedbackMessage;
        if (correctAnswers.includes(userAnswer)) {
            feedbackMessage = '<span class="bold-feedback">Правильный ответ!</span> ' + currentQuestion.questionComment;
            this._send_action_value('read', 'Правильный ответ! ');
        } else {
            feedbackMessage = `<span class="bold-feedback">Неправильный ответ.</span> <span class="bold-feedback">Правильный ответ:</span> ${correctAnswer}. ${currentQuestion.questionComment}`;
            this._send_action_value('read', 'Неправильный ответ. Правильный ответ: ' + correctAnswer);
        }

        this.setState({
            feedback: feedbackMessage,
            hasAnswered: true,
        });
    }

    next_question() {
        this.setState({
            currentQuestionIndex: this.getRandomIndex(),
            answer: '',
            feedback: '',
            attemptCount: 0,
            comment: '',
            hasAnswered: false,
        });
    }

    read_question() {
        let { currentQuestionIndex } = this.state;
        const currentQuestion = questions[currentQuestionIndex];
        this._send_action_value('read_q', currentQuestion.questionText);
    }

    handleChange = (event) => {
        this.setState({ answer: event.target.value });
    };

    handleSubmit = () => {
        if (!this.state.hasAnswered) {
            this.check_answer({ answer: this.state.answer });
        }
    };

    adjustFontSize = () => {
        console.log('adjustFontSize called');
        const questionText = document.querySelector('.question-text');
        if (!questionText) return;

        const container = questionText.parentElement;
        const style = window.getComputedStyle(questionText);
        let fontSize = parseInt(style.fontSize, 10);
        const maxFontSize = 20; // максимальный размер шрифта
        const minFontSize = 12; // минимальный размер шрифта


        questionText.style.fontSize = `${fontSize}px`;

        // Увеличить размер шрифта до максимального, если текст помещается
        while (questionText.scrollHeight <= container.clientHeight && fontSize < maxFontSize) {
            fontSize += 1;
            questionText.style.fontSize = `${fontSize}px`;
        }

        // Уменьшить размер шрифта, если текст не помещается
        while (questionText.scrollHeight > container.clientHeight && fontSize > minFontSize) {
            fontSize -= 1;
            questionText.style.fontSize = `${fontSize}px`;
        }
    };

    render() {
        const { currentQuestionIndex, answer, feedback, hasAnswered } = this.state;
        window.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'Enter':
                    this.handleSubmit();
                    break;
                default:
                    { };
            }
        });
        return (
            <div className="App">
                <header className="App-header">
                    <h1>Знаток Онлайн</h1>
                    <p>Проверь свой уровень эрудиции и знаний!</p>
                </header>
                <div className="question-container">
                    <div className="question-text">
                        {questions[currentQuestionIndex].questionText}
                    </div>
                    <div className="question-feedback">
                        <div dangerouslySetInnerHTML={{ __html: feedback }}></div>
                        {!feedback && (
                            <p className="initial-comment">
                                Здесь будет выведен правильный ответ и комментарий к нему.
                            </p>
                        )}
                    </div>
                </div>
                <input
                    type="text"
                    value={answer}
                    onChange={this.handleChange}
                    placeholder="Введите свой ответ"
                    className="answer-input"
                    disabled={hasAnswered}
                />
                <div className="buttons">
                    <button className="submit-button" onClick={this.handleSubmit} disabled={hasAnswered}>Проверить ответ</button>
                    <button className="next-button" onClick={() => this.next_question()}>Следующий вопрос</button>
                </div>
            </div>
        );
    }
}

export default App;
