import {Injectable} from 'angular2/core';
import {Headers, RequestOptions} from 'angular2/http';

import {EntityMeta} from "./EntityBase";
import {DataStore} from "./DataStore";
import {UserModel} from "../auth/UserModel";

var instanceOfApiRoot = null

@Injectable()
export class ApiRoot {
  // Points to {baseUrl}/api/v1
  root:EntityMeta;
  defaultSite:EntityMeta;
  baseUrl:string = "http://localhost:8080/";
  siteId:string = '48190c8c-42c4-46af-8d1a-0cd5db894797'
  authUser:UserModel;
  resourceRef:EntityMeta
  dataStore:DataStore
  authToken:string


  constructor(authUser:UserModel, dataStore:DataStore) {
    this.authUser = authUser
    this.dataStore = dataStore;
    this.authToken = ApiRoot.createAuthToken(authUser)
    dataStore.setAuth(authUser.username, authUser.password)
    try {
      let query = document.location.search.substring(1);
      let siteId = ApiRoot.parseQueryParam(query, "realmId");
      if (siteId) {
        this.siteId = siteId
        console.log('Site Id set to ', this.siteId)
      }
      let baseUrl = ApiRoot.parseQueryParam(query, 'baseUrl');
      console.log('Proxy server Base URL set to ', baseUrl)
      this.setBaseUrl(baseUrl) // if null, just uses the base of the current URL
      this.resourceRef = this.root.child('system/i18n')
      this.configureUser(query, authUser)
    } catch (e) {
      console.log("Could not set baseUrl automatically.")
    }
    instanceOfApiRoot = this;
  }

  private configureUser(query:string, user:UserModel):void {
    let suppressAlerts = ApiRoot.parseQueryParam(query, "suppressAlerts") === 'true'
    user.suppressAlerts = suppressAlerts
  }

  getDefaultRequestOptions():RequestOptions {

    var headers = new Headers();
    headers.append("com.dotmarketing.session_host", this.siteId)
    if (this.authToken) {
      headers.append('Authorization', this.authToken);
    }
    return new RequestOptions({
      headers: headers
    })
  }

  static createAuthToken(authUser:UserModel) {
    let token = null
    if (authUser && authUser.username && authUser.password) {
      token = 'Basic ' + btoa(authUser.username + ':' + authUser.password)
    }
    return token
  }

  static parseQueryParam(query:string, token:string):string {
    let idx = -1;
    let result = null
    token = token + '='
    if(query && query.length){
      idx = query.indexOf(token)
    }
    if (idx >= 0) {
      let end = query.indexOf('&', idx)
      end = end != -1 ? end : query.length
      result = query.substring(idx + token.length, end)
    }
    return result;
  };

  setBaseUrl(url=null){
    if(url === null){
      // set to same as current request
      let loc = document.location
      this.baseUrl =  loc.protocol + '//' + loc.host + '/'
    }
    else  if(url && (url.startsWith('http://' || url.startsWith('https://')))){
      this.baseUrl = url.endsWith('/') ? url : url + '/' ;
    } else {
      throw new Error("Invalid proxy server base url: '" + url + "'")
    }
    this.root = new EntityMeta(this.baseUrl + 'api/v1')
    this.defaultSite = this.root.child('sites/' + this.siteId)
  }


  getRoot():EntityMeta {
    return this.root
  }

  static instance(){
    return instanceOfApiRoot
  }
}