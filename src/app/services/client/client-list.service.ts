import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Client } from 'src/app/models/Client';
import { ApiService } from '../global/api.service';

@Injectable({
  providedIn: 'root'
})
export class ClientListService {
  apiUrlG = this.apiService.getApiUrl();

  private apiUrl = this.apiUrlG+'/api/auth/clients/';
  private apiUrl2 = this.apiUrlG+'/api/auth/user/';
  private apiUrl3 = this.apiUrlG+'/api/auth/create-client/';

  constructor(
     private http: HttpClient,
     private apiService: ApiService,
  ) { }

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl);
  }
  getUserById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl2}${id}/`);
  }

  updateClient(ClientId: number, updatedClientData: Partial<Client>): Observable<Client> {
    const url = `${this.apiUrl2}${ClientId}/`;
    return this.http.put<Client>(url, updatedClientData);
  }

  createUser(userData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl3, userData);
  }
  removeClient(ClientId: number): Observable<any> {
    const url = `${this.apiUrl2}${ClientId}/`;
    return this.http.delete(url);
  }
}
