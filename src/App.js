import React, { Component } from 'react';

import EthAvatarContract from '../build/contracts/EthAvatar.json';
import { getWeb3 } from './utils/getWeb3';

import Container from './components/Container.js';
import EthAvatarImage from './components/EthAvatarImage.js';
import EthAvatarForm from './components/EthAvatarForm.js';

import './css/oswald.css';
import './css/open-sans.css';
import './css/pure-min.css';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      web3: undefined,
      ethAddress: undefined,
      ethAvatarInstance: undefined,
      ethAvatarIPFSHash: undefined,
      selectedIndex: undefined,
    };
  }

  async componentWillMount() {
    try {
      // Get network provider and web3 instance.
      // See utils/getWeb3 for more info.
      const results = await getWeb3();

      this.setState({
        web3: results.web3,
        ethAddress: results.web3.eth.coinbase
      });

      // Instantiate contract once web3 provided.
      this.instantiateContract();
    }
    catch (err) {
      this.setState({
        web3: null
      });
      console.error('Error finding web3.');
    }
  }

  instantiateContract() {
    const contract = require('truffle-contract');
    const ethAvatar = contract(EthAvatarContract);
    ethAvatar.setProvider(this.state.web3.currentProvider);

    // Get accounts.
    this.state.web3.eth.getAccounts(async (error, accounts) => {
      try {
        const instance = await ethAvatar.deployed();
        const ethAvatarInstance = instance;

        this.setState({
          ethAvatarInstance,
        });

        // watch the DidSetIPFSHash event
        const didSetIPFSHashEvent = ethAvatarInstance.DidSetIPFSHash();
        didSetIPFSHashEvent.watch((error, result) => {
            if(!error)
            {
              // set the updated hash
              if(result.args.hashAddress === this.state.ethAddress)
                this.setState({ ethAvatarIPFSHash: result.args.hash });
            }
          }
        );

        // use ethAvatarInstance to retreive the hash of the current account
        const result = await ethAvatarInstance.getIPFSHash.call(this.state.ethAddress);

        // Update state with the result.
        this.setState({ ethAvatarIPFSHash: result });
      }
      catch (err) {
        console.error(err);
      }
    });
  }

  handleNavigation = (selectedIndex) => (evt) => {
    this.setState({selectedIndex});
    evt.preventDefault();
    return false;
  }

  render() {
    if(this.state.web3 === null) {
      return(
        // Display a web3 warning.
        <Container
          isBlurred={true}
          isCentered={true}
          selectedIndex={this.state.selectedIndex}
          handleNavigation={this.handleNavigation}
        >
          <h2>No Connection To The Ethereum Network</h2>
          <p>Browse this website with:</p>
          <p>MetaMask / Parity / Mist</p>
          <a href="/help">Need Help?</a>
        </Container>
      );
    }

    if(this.state.ethAddress === null) {
      return(
        // Display a web3 warning.
        <Container
          isBlurred={true}
          isCentered={true}
          selectedIndex={this.state.selectedIndex}
          handleNavigation={this.handleNavigation}
        >
          <h2>MetaMask seems to be locked.</h2>
          <p>Unlock MetaMask needs to be unlocked to continue.</p>
        </Container>
      );
    }

    if(this.state.ethAvatarIPFSHash !== undefined) {
      return (
        <Container
          isBlurred={false}
          isCentered={false}
          selectedIndex={this.state.selectedIndex}
          handleNavigation={this.handleNavigation}
        >
          <h4>Your ETH Address:</h4>
          <h3>{this.state.ethAddress}</h3>
          <div className="blue-stripe">
            <EthAvatarImage ethAvatarInstance={this.state.ethAvatarInstance} ethAddress={this.state.ethAddress} ipfsHash={this.state.ethAvatarIPFSHash} />
            {/* <EthAvatarForm ethAvatarInstance={this.state.ethAvatarInstance} ethAddress={this.state.ethAddress} /> */}
          </div>
        </Container>
      );
    }

    return(
      // Display a loading indicator.
      <Container
        isBlurred={false}
        isCentered={true}
        selectedIndex={this.state.selectedIndex}
        handleNavigation={this.handleNavigation}
      >
        <h2>Loading EthAvatar...</h2>
      </Container>
    );
  }
}

export default App;
