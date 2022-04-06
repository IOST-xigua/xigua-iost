import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-xplus',
  templateUrl: './xplus.component.html',
  styleUrls: ['./xplus.component.css']
})
export class XplusComponent implements OnInit {
  @Input() profile: any;
  constructor() { }

  ngOnInit() {
  }

}
