import React, { Component } from 'react';
import {HikeCard} from './Results';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

export class SavedHikes extends Component {
    constructor(props) {
        super(props);
        this.state = {
            displayHikes: [],
            savePage: true, 
            user: {}
        }
    }

    componentDidMount() {
        // if user is signed in or not
        this.authUnRegFunc = firebase.auth().onAuthStateChanged((firebaseUser) => {
            if(firebaseUser){ //signed in!
                this.setState({user: firebaseUser});
                // gets the trails saved by the signed in user from Firebase
                this.hikeRef = firebase.database().ref('users/' + firebaseUser.uid + "/savedHikes");
                this.hikeRef.on('value', (snapShot) => {
                    let hikeData = snapShot.val();
                    if (hikeData !== null) {
                        let hikeKeys = Object.keys(hikeData);
                        let hikeArray = hikeKeys.map((key) => {
                            let hike = hikeData[key];
                            hike.key = key;
                            return hike;
                        })
                        this.setState({displayHikes: hikeArray});
                    }
                })
            } else { //signed out
                this.setState({user: null});
            }
        });
    }

    componentWillUnmount() {
        if( this.hikeref){
            this.hikeRef.off();
        }
    }

    lastSaved = () => {
        this.setState({displayHikes: []});
    }

    render() {
        let savedHikes = this.state.displayHikes.map((current, index) => {
            return <HikeCard hike={current.hike} key={index} savePage={this.state.savePage} 
                user={this.state.user} saveRef={this.state.displayHikes} lastSaved={this.lastSaved}/>
        })

        // let noHikes;
        // if (this.state.displayHikes.length !== 0) {
        //     noHikes = <h1>Your Hikes</h1>
        // } else {
        //     noHikes = <p>No Hikes Saved</p>
        // }
        let noHikes;
        if (this.state.displayHikes.length === 0) {
            noHikes = <h1>No Hikes Saved</h1>
        } else {
            noHikes = <h1>Your Hikes</h1>
        }
        
        return (
            <div>
                {noHikes}
                <div className="hike-results card-container">
                    <div className='row d-flex justify-content-center'>
                        {savedHikes}
                    </div>
                </div>
            </div>
        );
    }
}