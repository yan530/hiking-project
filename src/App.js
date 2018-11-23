import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import './App.scss';
import {NavBar} from './NavBar';
import {Header} from './Header';
import {Main} from './Main';
import {Footer} from './Footer';

class App extends Component {

    constructor(props){
        super(props);

        this.state = {
            searchTerm: '',
            lat: '47.6062',
            lng: '-122.3321',
            hikes: {},
            maxDist: 100,
            maxResults: 30,
            easy: true,
            medium: true,
            hard: true,
            error: ""
        }

    }

    search = (term, error) => {


        let url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + term + '&key=AIzaSyBifT_4HbuyAHS6I01s-4ZRjO_P5F3plGg';

       let promise = fetch(url);

       promise.then(function(response){
           return response.json();
       })
       .then((data) => {
           let address = data.results[0].geometry;
            this.getLocation(address.location.lat,address.location.lng, error);
       })
       .catch((err) => {
           console.log("here");
           this.getError(err);
       });
    }

    getError = (error) => {
        this.setState(() => {
            return {error: error}
        })
    }

    getLocation = (lat, lng, error) => {
        this.setState(() => {
             return {
                 lat: lat,
                 lng: lng,
                 error: error
             }
        })
    }

    getFilter = (target) => {
        let name = target.name;
        if (target.checked) {
            this.setState({ [name]: target.value });
        } else {
            this.setState({ [name]: !target.value });
        }
    }

    render() {
        let error = this.state.error !== "" ? <div className="error-message">{this.state.error}</div>: null;
        return (
            <div className='home'>
                <NavBar />
                <Header 
                    searchTerm={this.state.searchTerm} 
                    lat={this.state.lat} 
                    lng={this.state.lng} 
                    howToSearch={this.search} 
                    getFilter={this.getFilter} 
                    getLocation={this.getLocation} 
                    easy={this.state.easy} 
                    medium={this.state.medium} 
                    hard={this.state.hard}
                    error={this.state.error} 
                    getError={this.getError}/>
                {error}
                <Main searchTerm={this.state.searchTerm} 
                    lat={this.state.lat} lng={this.state.lng} 
                    maxDist={this.state.maxDist} 
                    maxResults={this.state.maxResults}
                    easy={this.state.easy} 
                    medium={this.state.medium} 
                    hard={this.state.hard}/>
                <Footer />
            </div>
        )
    }
}


export default App;