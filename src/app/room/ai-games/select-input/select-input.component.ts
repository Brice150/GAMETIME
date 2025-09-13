import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Room } from 'src/app/core/interfaces/room';

@Component({
  selector: 'app-select-input',
  imports: [CommonModule],
  templateUrl: './select-input.component.html',
  styleUrl: './select-input.component.css',
})
export class SelectInputComponent implements OnInit, OnChanges {
  @Input() index: number = 0;
  readonly room = input.required<Room>();
  @Output() emitEvent = new EventEmitter<boolean>();
  isOver = false;

  ngOnInit(): void {
    if (this.index !== undefined) {
      this.isOver = false;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['index']?.firstChange ||
      changes['room']?.previousValue.isReadyNotificationActivated !==
        changes['room']?.currentValue.isReadyNotificationActivated
    ) {
      return;
    }

    this.ngOnInit();
  }

  submitAnswer(answer: string): void {
    if (this.isOver) {
      return;
    }

    this.isOver = true;
    this.emitEvent.emit(answer === this.room().responses[this.index]);
  }
}
