import gsap from "gsap"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"
import { Observer } from "gsap/Observer"

const breakpoints = (() => {
	let style = getComputedStyle(document.documentElement)

	return {
		mobile: parseInt(style.getPropertyValue("--mobile")),
		tablet: parseInt(style.getPropertyValue("--tablet")),
		laptop: parseInt(style.getPropertyValue("--laptop"))
	}
})()


document.addEventListener('DOMContentLoaded', function () {
	gsap.registerPlugin(ScrollToPlugin)
	gsap.registerPlugin(Observer)

	gsap.to(window, {
		scrollTo: "start"
	})

	/**
	 * @type NodeListOf<HTMLElement>
	 */
	let targets = document.querySelectorAll(".timeline__section")
	let currentIndex = 0
	let startIndex
	let watchDevice = matchMedia(`(max-width: ${breakpoints.mobile}px)`)
	let isMobile = watchDevice.matches
	let timeline = document.querySelector(".timeline")
	let timelineStyle = getComputedStyle(timeline)
	let duration = parseInt(timelineStyle.getPropertyValue("--duration"))
	let isBlocked = false
	watchDevice.addEventListener("change", () => {
		isMobile = watchDevice.matches
	})

	function limitNimber(min, target, max) {
		return Math.max(min, Math.min(target, max))
	}

	let observer = new IntersectionObserver(etnries => {
		for (const entry of etnries) {
			entry.target.classList.toggle("is-visible", entry.isIntersecting)
		}
	}, {
		threshold: [0.3],
		root: timeline
	})

	targets.forEach(test => {
		observer.observe(test)
	})

	Observer.create({
		target: timeline,
		lockAxis: true,
		onChange: (self) => {
			let scrollDelta = self.deltaY
			if (window.TouchEvent && self.event instanceof TouchEvent) {
				scrollDelta *= -1
				if (!isMobile) {
					scrollDelta = -self.deltaX
				}
			}
			let direction = Math.sign(scrollDelta)
			let nextIndex = limitNimber(0, (currentIndex ?? startIndex) + direction, targets.length - 1)
			let nextItem = targets.item(nextIndex)
			let currentItem = targets.item(currentIndex ?? startIndex)
			let inactiveWidth = timelineStyle.getPropertyValue("--section-size")
			let activeWidth = timelineStyle.getPropertyValue("--section-size-active")

			if (nextItem != currentItem && !isBlocked) {
				isBlocked = true
				if (!isMobile) {
					nextItem.classList.add("is-active")
					currentItem.classList.remove("is-active")
					let tl = gsap.timeline({
						defaults: {
							duration: duration
						}
					})
					if (direction > 0) {
						tl.to(nextItem, {
							width: activeWidth,
						}, "<").to(currentItem, {
							opacity: 0,
							transform: `translateX(100%)`
						}, "<").to(timeline, {
							scrollTo: nextItem,
							onComplete: () => {
								currentIndex = nextIndex
								isBlocked = false
							}
						}, "<")
					} else {
						tl.to(nextItem, {
							opacity: 1,
							transform: `translateX(0%)`
						}, "<").to(currentItem, {
							width: inactiveWidth,
						}, "<").to(timeline, {
							scrollTo: targets.item(nextIndex - 1) ?? { x: 0 },
							onComplete: () => {
								currentIndex = nextIndex
								isBlocked = false
							}
						}, "<")
					}
				} else {
					if (nextItem.classList.contains("is-visible")) {
						gsap.to(timeline, {
							scrollTo: nextItem,
							duration: duration,
							onComplete: () => {
								currentIndex = nextIndex
								isBlocked = false
							}
						})
					}
				}
			}
		}
	})
})
