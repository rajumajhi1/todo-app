## Todo List App

A modern, responsive task management application with the following features:

- Create, edit, and delete tasks
- Set task priorities (Low, Normal, High)
- Mark tasks as complete
- Plan tasks for tomorrow
- Filter tasks by status and date
- Daily task summary generation
- Dark mode for different devices
- Responsive design for mobile, tablet, and desktop
- Firebase authentication and data storage
- Export/import tasks

### How to Use

1. Sign in with your Google account
2. Add tasks with priorities
3. Use filters to organize your view
4. Mark tasks as complete when done
5. Generate daily summaries of your accomplishments

## Set Up Development Environment

1. Clone the repository
2. Install dependencies
   ```
   npm install
   ```
3. Copy the `.env.example` file to a new file named `.env`
4. Add your API keys to the `.env` file:
   - OpenAI API key (for task summaries)
   - Firebase configuration details

## Firebase Setup

1. Create a new project on [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Set up Authentication with Google provider
4. Create a web app and copy your Firebase configuration
5. Add the configuration details to your `.env` file

## Running the App Locally

```
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Deployment to Vercel

### Prerequisites
- A Vercel account
- Vercel CLI installed (optional)

### Deployment Steps

1. Push your code to a GitHub repository

2. Connect your repository to Vercel:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables (all the ones from your `.env` file)
   - Deploy

3. Alternatively, use the Vercel CLI:
   ```
   npm install -g vercel
   vercel login
   vercel
   ```

4. For subsequent deployments, just push to your repository or run `vercel` again.

## Environment Variables

Make sure to add these environment variables to your Vercel project:

- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`
- `REACT_APP_OPENAI_API_KEY`

## Security Note

Never commit your `.env` file with API keys to version control. Always use environment variables for sensitive information.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## OpenAI Integration

This app includes integration with OpenAI's API to generate summaries of completed tasks. To use this feature:

1. Create an account on [OpenAI](https://platform.openai.com/) if you don't have one already
2. Generate an API key in your OpenAI dashboard
3. Copy the `.env.example` file to a new file named `.env`
4. Add your OpenAI API key to the `.env` file:
   ```
   REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
   ```
5. Restart the development server if it's already running

**IMPORTANT SECURITY NOTE:** Never commit your `.env` file with your API key to version control. The `.env` file is listed in `.gitignore` to prevent accidental commits.

For production deployment, set your environment variables through your hosting provider's dashboard (e.g., Vercel, Netlify, etc.) rather than in the `.env` file.
