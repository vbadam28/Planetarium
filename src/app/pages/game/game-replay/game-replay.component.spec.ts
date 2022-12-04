import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameReplayComponent } from './game-replay.component';

describe('GameReplayComponent', () => {
  let component: GameReplayComponent;
  let fixture: ComponentFixture<GameReplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GameReplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GameReplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
