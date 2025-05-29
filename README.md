# DigiByte Blockchain Stats

This project is a web application that displays DigiByte blockchain statistics. It uses React for the front end, Express for the backend, and communicates with a local digibyted full node using RPC commands.

## Prerequisites

To run this project, you'll need:

1. [Node.js](https://nodejs.org/) (version 14.x or higher) I used 21.7.2
2. A local DigiByte node with RPC enabled (e.g., [digibyted](https://github.com/digibyte-core/digibyte))

## Installation

### Install Node.js and npm on macOS using Homebrew

If you don't have Homebrew installed, follow the instructions on the [Homebrew website](https://brew.sh/) to install it.

Once Homebrew is installed, you can install Node.js and npm using the following commands:

```
brew update
brew install node
```

Check that Node.js and npm are installed by running:

```
node -v
npm -v
sudo npm install -g n
sudo n install 21.7.2
sudo n use 21.7.2
```

### Set up the project

1. Clone the repository:

```
git clone https://github.com/JaredTate/dgbstats.git
git clone https://github.com/JaredTate/dgbstats-server.git
```

2. Change to the project directory:

```
cd dgbstats
```

3. Install the dependencies:

```
npm install
```

## Configuration

1. Configure your local DigiByte node by editing its configuration file (\`digibyte.conf\`). You'll need to enable RPC and set a username and password. Add the following lines to the configuration file including turning on txindex, debug and server:

```
rpcuser=user
rpcpassword=password
server=1
txindex=1
debug=1
rpcworkqueue=64
rpcthreads=8
maxconnections=128
dandelion=0
blocknotify=/YourServerParth/dgbstats-server/blocknotify.sh %s
```

Replace \`user\` and \`password\` with your desired RPC username and password.

2. Start your local DigiByte node (\`digibyted\`). Follow the instructions provided by the DigiByte project to install and start the node.

3. Configure the backend server by updating the \`rpcUser\`, \`rpcPassword\`, and \`rpcUrl\` variables in the \`server.js\` file:

```
const rpcUser = 'user';
const rpcPassword = 'password';
const rpcUrl = 'http://127.0.0.1:14022';
```

Replace \`dgbuser\` and \`dgbpassword\` with the RPC username and password you set in the \`digibyte.conf\` file. Update the \`rpcUrl\` if your node is running on a different address or port.

## Running the Application

1. Start the backend server inside /dgbstats-server:

```
sudo npm start
```

The server will start on port 5001 or the port defined in your environment variable \`PORT\`.

2. Open a new terminal, and start the frontend application (in dgbstats folder:

```
sudo npm start
```

The application will open in your default web browser at \`http://localhost:3005/\`.

## Usage

Once both the backend server and frontend application are running, you can view DigiByte blockchain statistics in your browser. The statistics will be fetched from your local DigiByte node using RPC.

## Testing

This project includes a comprehensive test suite covering unit, integration, and end-to-end testing:

### Test Commands

```bash
# Unit & Integration Tests (Vitest)
npm test                 # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Run tests with coverage report
npm run test:ui          # Run tests with Vitest UI

# End-to-End Tests (Playwright)
npm run test:e2e         # Run E2E tests across all browsers
npm run test:e2e:ui      # Run E2E tests with Playwright UI

# Combined
npm run test:all         # Run all tests (unit + E2E)
```

### Test Coverage

The project maintains 95%+ code coverage across:
- **Unit Tests**: 214 tests covering individual components
- **Integration Tests**: Component interaction and data flow testing
- **E2E Tests**: 1,112 tests across 7 browsers (Chrome, Firefox, Safari, Edge, Mobile)

### Browser Support

E2E tests run on:
- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Mobile Chrome, Mobile Safari, Mobile Safari Legacy

### Key Testing Features

- **Real-time WebSocket Testing**: Mock WebSocket connections for blockchain data
- **Chart Testing**: D3.js and Chart.js visualization testing
- **Accessibility Testing**: WCAG compliance and screen reader compatibility
- **Performance Testing**: Page load times, memory usage, and responsiveness
- **Cross-browser Compatibility**: Comprehensive browser engine testing
- **Mobile Responsiveness**: Touch interactions and viewport testing

For detailed testing documentation, see `src/tests/README.md`.

## License

This project is open-source and available under the [MIT License](https://opensource.org/licenses/MIT).
