import { Component, OnInit, OnDestroy } from '@angular/core';
import { Exercise } from '../exercise.model';
import { Subscription } from 'rxjs';
import { ProfileService } from '../../profile/profile.service';
import { TrainingService } from '../training.service';
import { User, UserProfile } from '../../auth/user.model';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-training-new',
  templateUrl: './training-new.page.html',
  styleUrls: ['./training-new.page.scss'],
})
export class TrainingNewPage implements OnInit, OnDestroy {

  today: string;
  exercisesTime: Exercise[];
  exercisesQty: Exercise[];
  exercisesCal: Exercise[];
  private newTrainingSubs: Subscription[] = [];
  private loggedUser: User;
  loggedUserProfile: UserProfile;
  userWeight: number;
  exerciseType = 'timeEx';
  minValue = 0;
  maxSlider = 25;
  minSlider = 0;
  stepSlider = 1;
  tickIntervalSlider = 1;
  returnWeight = '0kg / 0lb';
  // initial date filter setting
  filteredDay = new Date();
  startFilteredDay = new Date(this.filteredDay).setHours(0, 0, 0, 0);
  endFilteredDay = new Date(this.filteredDay).setHours(24, 0, 0, -1);
  // table styling
  tableData: Exercise[];
  tableDataFilter: Exercise[];
  columns = [
              { name: 'Date', prop: 'dateStr'},
              { name: 'Name', prop: 'name'},
              { name: 'Calories', prop: 'caloriesOut'},
              { name: 'Duration', prop: 'duration'},
              { name: 'Quantity', prop: 'quantity'}
            ];
  colAction = [{ name: 'Actions', prop: 'actions'}];
  allColumns = [
              { name: 'Date', prop: 'dateStr'},
              { name: 'Name', prop: 'name'},
              { name: 'Calories', prop: 'caloriesOut'},
              { name: 'Duration', prop: 'duration'},
              { name: 'Quantity', prop: 'quantity'}
            ];
  allAction = [{ name: 'Actions', prop: 'actions'}];
  tableClass = 'dark';
  tableStyle = 'dark';


  constructor(private profileService: ProfileService,
              public trainingService: TrainingService,
              private authService: AuthService) { }

  ngOnInit() {
    this.today = new Date().toISOString();

    this.newTrainingSubs.push(this.profileService.userProfileData
      .subscribe(
        userProfileData => {
          this.loggedUserProfile = userProfileData;
          this.updateFilteredDate(this.loggedUserProfile.userId);
      })
    );

    this.newTrainingSubs.push(this.authService.user // getter, not event emitter
      .subscribe(user => {
        this.loggedUser = user;
        if (this.loggedUser !== null) {
          this.profileService.getUserData(this.loggedUser.id); // event emitter for sub;
        }
      })
    );

    this.newTrainingSubs.push(this.trainingService.exercisesTimeChanged
      .subscribe(
        exercises => (this.exercisesTime = exercises)
      ));
    this.trainingService.fetchAvailableExercisesTime();

    this.newTrainingSubs.push(this.trainingService.exercisesQtyChanged
    .subscribe(
      exercises => (this.exercisesQty = exercises)
    ));
    this.trainingService.fetchAvailableExercisesQty();

    this.newTrainingSubs.push(this.trainingService.exercisesCalChanged
    .subscribe(
      exercises => (this.exercisesCal = exercises)
    ));
    this.trainingService.fetchAvailableExercisesCal();

    // subscription when filter date changes
    this.newTrainingSubs.push(this.trainingService.dateFilter
    .subscribe((date: Date) => {
        this.filteredDay = date; // comes from datepicker change event formatted as 0:0:00
        this.startFilteredDay = new Date(this.filteredDay).setHours(0, 0, 0, 0);
        this.endFilteredDay = new Date(this.filteredDay).setHours(24, 0, 0, -1);
        this.updateFilteredDate(this.loggedUserProfile.userId);
      }));

  }

  updateFilteredDate(userFirebaseId: string) {
    this.newTrainingSubs.push(this.trainingService.finishedExercisesChanged
    .subscribe((exercises: Exercise[]) => {
      this.tableData = exercises.filter(val => {
        return val.date['seconds'] * 1000 >= this.startFilteredDay &&
        val.date['seconds'] * 1000  <= this.endFilteredDay;
      });
      this.tableDataFilter = this.tableData;
    }));
    this.trainingService.fetchCompletedExercises(userFirebaseId);
  }

  segmentChanged(event: any) {
    this.exerciseType = event.target.value;
  }

  switchStyle() {
    if (this.tableClass === 'dark') {
      this.tableClass = 'bootstrap';
      this.tableStyle = 'light';
    } else {
      this.tableClass = 'dark';
      this.tableStyle = 'dark';
    }
  }

  doFilter(filterValue: string) {
    const filteredValue = filterValue.trim().toLowerCase();
    const filteredData = [...this.tableDataFilter].filter(val => {
      return val.name.toLowerCase().indexOf(filteredValue) !== -1 || !filteredValue;
    });

    if (filterValue) {
      this.tableData = filteredData;
    } else {
      this.tableData = this.tableDataFilter;
    }
  }

  toggle(col) {
    const isChecked = this.isChecked(col);

    if (isChecked) {
      this.columns = this.columns.filter(c => {
        return c.name !== col.name;
      });
    } else {
      this.columns = [...this.columns, col];
    }
  }

  toggleAction(col) {
    const isChecked = this.isCheckedAction(col);

    if (isChecked) {
      this.colAction = this.colAction.filter(c => {
        return c.name !== col.name;
      });
    } else {
      this.colAction = [...this.colAction, col];
    }
  }

  // if found returns true, else false (if c.name = undefined)
  isChecked(col) {
    return (
      this.columns.find(c => {
        return c.name === col.name;
      }) !== undefined
    );
  }

  // if found returns true, else false (if c.name = undefined)
  isCheckedAction(col) {
    return (
      this.colAction.find(c => {
        return c.name === col.name;
      }) !== undefined
    );
  }

  formatLabel(value: number) {
    if (isNaN(value)) {
      value = 0;
    }
    this.returnWeight = value + 'kg / ' + Math.round(value / 0.454) + 'lb';
  }

  ngOnDestroy() {
    if (this.newTrainingSubs) {
      this.newTrainingSubs.forEach(sub => sub.unsubscribe());
    }
  }

}
