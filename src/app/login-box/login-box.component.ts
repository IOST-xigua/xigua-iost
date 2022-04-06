import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login-box',
  templateUrl: './login-box.component.html',
  styleUrls: ['./login-box.component.css']
})
export class LoginBoxComponent implements OnInit {

  language: number = 0;

  constructor() { }

  ngOnInit() {
    this.language = parseInt(localStorage.getItem('language'));
  }

  changeLanguage(language: number) {
    this.language = language;
  }
}
