import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormGroup, NgForm, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ProfileService } from '../profile.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { User, UserProfile } from '../../auth/user.model';

@Component({
  selector: 'app-user-activity-level',
  templateUrl: './user-activity-level.page.html',
  styleUrls: ['./user-activity-level.page.scss'],
})
export class UserActivityLevelPage implements OnInit, OnDestroy {

  listActivities = [];
  total: any = 0;
  userActivityFormGroup: FormGroup;
  loggedUser: User;
  loggedUserProfile: UserProfile;
  private activityLevelSubs: Subscription[] = [];

  constructor(private router: Router,
              private profileService: ProfileService,
              private authService: AuthService) { }

  ngOnInit() {

    this.activityLevelSubs.push(this.authService.user // getter, not event emitter
      .subscribe(user => {
        this.loggedUser = user;
        this.profileService.getUserData(this.loggedUser.id); // event emitter for sub at line 47;
      })
    );

    console.log('user-activity-level ran1');

    // need it to activate event emitter in the service
    this.profileService.getActivitiesList();

    this.activityLevelSubs.push(this.profileService.activitiesList
      .subscribe(actList => {
        this.listActivities = actList;
        this.makeForm(actList);
      })
    );

    this.activityLevelSubs.push(this.profileService.userProfileData
      .subscribe(
        userProfileData => {
          this.loggedUserProfile = userProfileData;
      })
    );
  }

  makeForm(activities) {
    const formDataObject = {};
    let i = 0;
    // tslint:disable-next-line: forin
    for (const key in activities) {
      formDataObject[`hoursControl_${i}`] = new FormControl(0, {validators: [Validators.min(0), Validators.max(24)]});
      i++;
    }
    this.userActivityFormGroup = new FormGroup(formDataObject);
  }

  calcRMR(actList, actHours) {
    let i = 0;
    let totalActivityHoursFiltered = 0;
    let totalActivitiesHoursProduct = 0;
    for (const [activity, pal] of Object.entries(actList)) {
      if (activity !== 'exercising (tracked here)' && activity !== 'walking (tracked here)' && actHours[i] !== 0) {
        const activityHours = actHours[i]; // hours assigned by user to this activity
        totalActivityHoursFiltered += activityHours;
        totalActivitiesHoursProduct = totalActivitiesHoursProduct + (+pal * activityHours);
      }
      i++;
    }
    const coefficientRMR = Math.round((totalActivitiesHoursProduct / totalActivityHoursFiltered) * 100) / 100;
    // adding properties to loggedUserProfile object()
    this.profileService.addOrUpdateUser({ ...this.loggedUserProfile, activityLevel: coefficientRMR });
  }

  onSave() {
    this.calcRMR(this.listActivities, Object.values(this.userActivityFormGroup.value));
    this.router.navigateByUrl('profile/user-profile');
  }

  sumHours() {
    // 0 stands for initial value
    this.total = Object.values(this.userActivityFormGroup.value).reduce((a: number, b: number) => +a + +b, 0);
  }

  ngOnDestroy() {
    console.log('user-activity-level ran2');
    if (this.activityLevelSubs) {
      console.log('user-activity-level ran3');
      this.activityLevelSubs.forEach(sub => sub.unsubscribe());
    }
  }

}
